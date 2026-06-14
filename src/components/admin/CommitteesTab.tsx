import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListCommittees, adminUpdateCommittee } from "@/lib/admin.functions";

export function CommitteesTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListCommittees);
  const upd = useServerFn(adminUpdateCommittee);
  const { data, isLoading } = useQuery({ queryKey: ["admin-committees"], queryFn: () => list(), refetchInterval: 30000 });
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; icon: string; tagline: string; description: string; highlights: string }>({
    name: "", icon: "", tagline: "", description: "", highlights: "",
  });
  const [saving, setSaving] = useState(false);

  if (isLoading) return <p style={{ color: "var(--muted)" }}>Loading committees…</p>;

  const startEdit = (c: NonNullable<typeof data>[number]) => {
    setEditing(c.id);
    setForm({
      name: c.name, icon: c.icon, tagline: c.tagline, description: c.description,
      highlights: (c.highlights as string[]).join("\n"),
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await upd({
        data: {
          id: editing,
          name: form.name,
          icon: form.icon,
          tagline: form.tagline,
          description: form.description,
          highlights: form.highlights.split("\n").map((l) => l.trim()).filter(Boolean),
        },
      });
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-committees"] });
      qc.invalidateQueries({ queryKey: ["committees"] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-list">
      {(data ?? []).map((c) => (
        <div key={c.id} className="admin-row">
          {editing === c.id ? (
            <div className="admin-row-body" style={{ display: "block" }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "0.6rem" }}>
                <div className="field-group"><label>Icon</label><input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
                <div className="field-group"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              </div>
              <div className="field-group"><label>Tagline</label><input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
              <div className="field-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="field-group"><label>Highlights (one per line)</label><textarea rows={5} value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} /></div>
              <div className="wizard-actions">
                <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          ) : (
            <div className="admin-row-head" style={{ cursor: "default" }}>
              <div>
                <strong>{c.icon} {c.name}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{c.tagline}</div>
              </div>
              <button className="btn-secondary" onClick={() => startEdit(c)}>Edit</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
