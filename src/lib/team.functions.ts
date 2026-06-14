import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listTeamMembers = createServerFn({ method: "GET" }).handler(async () => {
  // Public read — use the anon client so service role key is not exposed
  // unnecessarily. The team_members table has a "Public read" RLS policy.
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await supabase
    .from("team_members")
    .select("id,name,role,department,photo_url,bio,kind,committee_id,sort_order")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  department: z.string().max(160).optional().nullable(),
  photo_url: z.string().url().max(2000).optional().nullable().or(z.literal("")),
  bio: z.string().max(2000).optional().nullable().or(z.literal("")),
  kind: z.enum(["executive", "director"]),
  committee_id: z.string().max(64).optional().nullable().or(z.literal("")),
  sort_order: z.number().int().min(0).max(999).default(0),
});

export const adminUpsertTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      role: data.role,
      department: data.department || null,
      photo_url: data.photo_url || null,
      bio: data.bio || null,
      kind: data.kind,
      committee_id: data.committee_id || null,
      sort_order: data.sort_order,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("team_members").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("team_members").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("team_members").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });