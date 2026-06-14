import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listSiteImages,
  adminUploadSiteImage,
  adminSetSiteImageUrl,
  adminDeleteSiteImage,
  adminListImageVersions,
  adminRestoreImageVersion,
  adminUndoLastImageChange,
} from "@/lib/site-images.functions";
import { adminListCommittees } from "@/lib/admin.functions";
import { COMMITTEE_IDS, heroKey, studioKey, committeeKey, HERO_IMG, STUDIO_IMG, COMMITTEE_IMAGES } from "@/lib/tcl-images";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const idx = res.indexOf(",");
      resolve(idx >= 0 ? res.slice(idx + 1) : res);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type ImageSlot = { key: string; label: string; fallback?: string };

function ImageSlotRow({ slot, current, onChanged }: { slot: ImageSlot; current?: string; onChanged: () => void }) {
  const upload = useServerFn(adminUploadSiteImage);
  const setUrl = useServerFn(adminSetSiteImageUrl);
  const del = useServerFn(adminDeleteSiteImage);
  const undo = useServerFn(adminUndoLastImageChange);
  const listVersions = useServerFn(adminListImageVersions);
  const restoreVersion = useServerFn(adminRestoreImageVersion);
  const [busy, setBusy] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<{ id: string; url: string; storage_path: string | null; created_at: string }[] | null>(null);
  const shown = current || slot.fallback;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { setErr("Max 12MB"); return; }
    setBusy(true); setErr(null);
    try {
      const dataBase64 = await fileToBase64(file);
      await upload({ data: { key: slot.key, filename: file.name, contentType: file.type || "image/jpeg", dataBase64 } });
      onChanged();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const saveUrl = async () => {
    if (!urlInput.trim()) return;
    setBusy(true); setErr(null);
    try {
      await setUrl({ data: { key: slot.key, url: urlInput.trim() } });
      setUrlInput("");
      onChanged();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!current) return;
    if (!confirm("Delete this image? You can undo or restore it from history.")) return;
    setBusy(true); setErr(null);
    try {
      await del({ data: { key: slot.key } });
      onChanged();
      if (showHistory) await loadVersions();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const loadVersions = async () => {
    try {
      const rows = await listVersions({ data: { key: slot.key, limit: 20 } });
      setVersions(rows);
    } catch (ex) {
      setErr((ex as Error).message);
    }
  };

  const toggleHistory = async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next) await loadVersions();
  };

  const doUndo = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await undo({ data: { key: slot.key } });
      if (!res.ok) setErr(res.reason);
      onChanged();
      if (showHistory) await loadVersions();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async (versionId: string) => {
    setBusy(true); setErr(null);
    try {
      await restoreVersion({ data: { key: slot.key, versionId } });
      onChanged();
      await loadVersions();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-row">
      <div className="admin-row-body" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "1rem", alignItems: "center" }}>
        <div style={{ width: 120, height: 80, borderRadius: 8, overflow: "hidden", background: "var(--navy-light)", border: "1px solid var(--border)" }}>
          {shown ? <img src={shown} alt={slot.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
            <strong>{slot.label}</strong>
            <span style={{ fontSize: "0.75rem", color: current ? "var(--accent)" : "var(--muted)" }}>
              {current ? "Custom" : "Default"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input type="file" accept="image/*" onChange={handleFile} disabled={busy} />
            <input
              className="admin-input"
              placeholder="…or paste an image URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{ minWidth: 220, flex: 1 }}
            />
            <button className="btn-secondary" onClick={saveUrl} disabled={busy || !urlInput.trim()}>Save URL</button>
            <button className="btn-secondary" onClick={doUndo} disabled={busy} title="Revert to the previous version">↶ Undo</button>
            <button className="btn-secondary" onClick={toggleHistory} disabled={busy}>
              {showHistory ? "Hide history" : "History"}
            </button>
            {current && <button className="btn-secondary" onClick={reset} disabled={busy} style={{ color: "salmon" }}>Delete</button>}
          </div>
          {busy && <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: 4 }}>Working…</div>}
          {err && <div style={{ color: "salmon", fontSize: "0.8rem", marginTop: 4 }}>{err}</div>}
          {showHistory && (
            <div style={{ marginTop: "0.6rem", padding: "0.6rem", background: "var(--navy-light)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.4rem" }}>
                Previous versions {versions ? `(${versions.length})` : ""}
              </div>
              {!versions && <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Loading…</div>}
              {versions && versions.length === 0 && <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No history yet.</div>}
              {versions && versions.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.5rem" }}>
                  {versions.map((v) => (
                    <div key={v.id} style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", background: "var(--bg)" }}>
                      <div style={{ width: "100%", aspectRatio: "4 / 3", background: "#000" }}>
                        <img src={v.url} alt="version" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ padding: "0.35rem", fontSize: "0.7rem", color: "var(--muted)" }}>
                        {new Date(v.created_at).toLocaleString()}
                      </div>
                      <button
                        className="btn-secondary"
                        style={{ width: "100%", borderRadius: 0, fontSize: "0.75rem", padding: "0.3rem" }}
                        disabled={busy}
                        onClick={() => doRestore(v.id)}
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ImagesTab() {
  const qc = useQueryClient();
  const list = useServerFn(listSiteImages);
  const listCommittees = useServerFn(adminListCommittees);
  const { data, isLoading } = useQuery({ queryKey: ["site-images"], queryFn: () => list(), refetchInterval: 60000 });
  const { data: committees } = useQuery({ queryKey: ["admin-committees"], queryFn: () => listCommittees() });

  if (isLoading) return <p style={{ color: "var(--muted)" }}>Loading images…</p>;

  const map = new Map((data ?? []).map((r) => [r.key, r]));
  const refresh = () => { qc.invalidateQueries({ queryKey: ["site-images"] }); };

  const slots: ImageSlot[] = [
    { key: heroKey, label: "Homepage hero", fallback: HERO_IMG },
    { key: studioKey, label: "Studio cover", fallback: STUDIO_IMG },
    ...COMMITTEE_IDS.map((id) => {
      const c = (committees ?? []).find((x) => x.id === id);
      return {
        key: committeeKey(id),
        label: `Committee — ${c ? `${c.icon} ${c.name}` : id}`,
        fallback: COMMITTEE_IMAGES[id],
      };
    }),
  ];

  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
        Upload a file or paste a URL for each image. Changes appear instantly across the site.
      </p>
      <div className="admin-list">
        {slots.map((s) => (
          <ImageSlotRow
            key={s.key}
            slot={s}
            current={map.get(s.key)?.url}
            onChanged={refresh}
          />
        ))}
      </div>
    </div>
  );
}
