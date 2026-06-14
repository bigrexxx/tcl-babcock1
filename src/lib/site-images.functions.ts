import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "site-images";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10; // ~10 years

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listSiteImages = createServerFn({ method: "GET" }).handler(async () => {
  // Public read — use the anon client. site_images has a public SELECT policy.
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await supabase
    .from("site_images")
    .select("key,url,storage_path,updated_at");
  if (error) throw new Error(error.message);
  return data ?? [];
});

async function snapshotCurrent(key: string, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("site_images")
    .select("url,storage_path")
    .eq("key", key)
    .maybeSingle();
  if (row?.url) {
    await supabaseAdmin.from("site_image_versions").insert({
      key, url: row.url, storage_path: row.storage_path ?? null, created_by: userId,
    });
  }
}

const uploadSchema = z.object({
  key: z.string().min(1).max(120).regex(/^[a-zA-Z0-9:_\-\/]+$/),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  // base64 (no data: prefix)
  dataBase64: z.string().min(8).max(15_000_000),
});

export const adminUploadSiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => uploadSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await snapshotCurrent(data.key, context.userId);
    const ext = data.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeKey = data.key.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const path = `${safeKey}/${Date.now()}.${ext}`;
    const bytes = Buffer.from(data.dataBase64, "base64");
    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: data.contentType, upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
    if (sErr || !signed) throw new Error(sErr?.message || "Failed to sign URL");
    const { error: dbErr } = await supabaseAdmin
      .from("site_images")
      .upsert({ key: data.key, url: signed.signedUrl, storage_path: path, updated_by: context.userId });
    if (dbErr) throw new Error(dbErr.message);
    return { ok: true, url: signed.signedUrl, key: data.key, path };
  });

const setSchema = z.object({
  key: z.string().min(1).max(120),
  url: z.string().url().max(2000),
});

export const adminSetSiteImageUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => setSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await snapshotCurrent(data.key, context.userId);
    const { error } = await supabaseAdmin
      .from("site_images")
      .upsert({ key: data.key, url: data.url, storage_path: null, updated_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteSiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ key: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // snapshot before delete so it can be restored (do not remove storage object).
    await snapshotCurrent(data.key, context.userId);
    const { error } = await supabaseAdmin.from("site_images").delete().eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListImageVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ key: z.string().min(1).max(120), limit: z.number().int().min(1).max(50).default(20) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("site_image_versions")
      .select("id,url,storage_path,created_at")
      .eq("key", data.key)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminRestoreImageVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ key: z.string().min(1).max(120), versionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: v, error: vErr } = await supabaseAdmin
      .from("site_image_versions")
      .select("url,storage_path,key")
      .eq("id", data.versionId)
      .maybeSingle();
    if (vErr) throw new Error(vErr.message);
    if (!v || v.key !== data.key) throw new Error("Version not found");
    await snapshotCurrent(data.key, context.userId);
    const { error } = await supabaseAdmin.from("site_images").upsert({
      key: data.key, url: v.url, storage_path: v.storage_path, updated_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true, url: v.url };
  });

export const adminUndoLastImageChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ key: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("site_image_versions")
      .select("id,url,storage_path,created_at")
      .eq("key", data.key)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    const v = rows?.[0];
    if (!v) return { ok: false, reason: "No previous version to undo" } as const;
    const { error: upErr } = await supabaseAdmin.from("site_images").upsert({
      key: data.key, url: v.url, storage_path: v.storage_path, updated_by: context.userId,
    });
    if (upErr) throw new Error(upErr.message);
    // consume that history row so repeated undo walks back further
    await supabaseAdmin.from("site_image_versions").delete().eq("id", v.id);
    return { ok: true, url: v.url } as const;
  });

const teamUploadSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  dataBase64: z.string().min(8).max(15_000_000),
});

export const adminUploadTeamPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => teamUploadSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = data.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `team/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = Buffer.from(data.dataBase64, "base64");
    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET).upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
    if (sErr || !signed) throw new Error(sErr?.message || "Failed to sign URL");
    return { url: signed.signedUrl, path };
  });