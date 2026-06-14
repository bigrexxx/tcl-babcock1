import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listTeamMembers, adminUpsertTeamMember, adminDeleteTeamMember } from "@/lib/team.functions";
import { adminListCommittees } from "@/lib/admin.functions";
import { adminUploadTeamPhoto } from "@/lib/site-images.functions";

type TeamForm = {
  id?: string;
  name: string;
  role: string;
  department: string;
  photo_url: string;
  bio: string;
  kind: "executive" | "director";
  committee_id: string;
  sort_order: number;
};

const emptyTeamForm: TeamForm = {
  name: "", role: "", department: "", photo_url: "", bio: "", kind: "executive", committee_id: "", sort_order: 0,
};

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

function PhotoUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const upload = useServerFn(adminUploadTeamPhoto);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setErr("Max 8MB"); return; }
    setBusy(true); setErr(null);
    try {
      const dataBase64 = await fileToBase64(file);
      const res = await upload({ data: { filename: file.name, contentType: file.type || "image/jpeg", dataBase64 } });
      onUploaded(res.url);
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  return (
    <div>
      <input type="file" accept="image/*" onChange={onChange} disabled={busy} />
      {busy && <span style={{ marginLeft: 8, color: "var(--muted)", fontSize: "0.8rem" }}>Uploading…</span>}
      {err && <div style={{ color: "salmon", fontSize: "0.8rem", marginTop: 4 }}>{err}</div>}
    </div>
  );
}

function TeamList({
  rows, committees, onEdit, onDelete,
}: {
  rows: { id: string; name: string; role: string; department: string | null; photo_url: string | null; kind: string; committee_id: string | null; sort_order: number }[];
  committees: { id: string; name: string; icon: string }[];
  onEdit: (m: any) => void;
  onDelete: (id: string) => void;
}) {
  if (rows.length === 0) return <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>None yet.</p>;
  return (
    <div className="admin-list">
      {rows.map((m) => {
        const committee = committees.find((c) => c.id === m.committee_id);
        return (
          <div key={m.id} className="admin-row">
            <div className="admin-row-head" style={{ cursor: "default", gap: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                {m.photo_url
                  ? <img src={m.photo_url} alt={m.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                  : <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--navy-light)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--cream)" }}>{m.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</div>}
                <div>
                  <strong>{m.name}</strong>
                  <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                    {m.role}{m.department ? ` · ${m.department}` : ""}{committee ? ` · ${committee.icon} ${committee.name}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button className="btn-secondary" onClick={() => onEdit(m)}>Edit</button>
                <button className="btn-secondary" onClick={() => onDelete(m.id)}>Delete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TeamTab() {
  const qc = useQueryClient();
  const list = useServerFn(listTeamMembers);
  const upsert = useServerFn(adminUpsertTeamMember);
  const del = useServerFn(adminDeleteTeamMember);
  const listCommittees = useServerFn(adminListCommittees);

  const { data, isLoading } = useQuery({ queryKey: ["admin-team"], queryFn: () => list(), refetchInterval: 30000 });
  const { data: committees } = useQuery({ queryKey: ["admin-committees"], queryFn: () => listCommittees() });

  const [form, setForm] = useState<TeamForm>(emptyTeamForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (isLoading) return <p style={{ color: "var(--muted)" }}>Loading team…</p>;

  const reset = () => { setForm(emptyTeamForm); setEditingId(null); };

  const startEdit = (m: NonNullable<typeof data>[number]) => {
    setEditingId(m.id);
    setForm({
      id: m.id,
      name: m.name,
      role: m.role,
      department: m.department ?? "",
      photo_url: m.photo_url ?? "",
      bio: m.bio ?? "",
      kind: (m.kind as "executive" | "director"),
      committee_id: m.committee_id ?? "",
      sort_order: m.sort_order ?? 0,
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await upsert({ data: { ...form, id: editingId ?? undefined } });
      qc.invalidateQueries({ queryKey: ["admin-team"] });
      qc.invalidateQueries({ queryKey: ["team-public"] });
      reset();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this team member?")) return;
    await del({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-team"] });
    qc.invalidateQueries({ queryKey: ["team-public"] });
    if (editingId === id) reset();
  };

  const executives = (data ?? []).filter((m) => m.kind === "executive");
  const directors = (data ?? []).filter((m) => m.kind === "director");
  const assignedCommitteeIds = new Set(directors.filter((d) => d.id !== editingId).map((d) => d.committee_id).filter(Boolean));

  return (
    <div>
      <div className="admin-row" style={{ marginBottom: "1.2rem" }}>
        <div className="admin-row-body" style={{ display: "block" }}>
          <h4 style={{ marginBottom: "0.8rem" }}>{editingId ? "Edit member" : "Add team member"}</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <div className="field-group"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field-group"><label>Role / Title</label><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. President or Director" /></div>
            <div className="field-group"><label>Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div className="field-group">
              <label>Kind</label>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as "executive" | "director", committee_id: e.target.value === "executive" ? "" : form.committee_id })}>
                <option value="executive">Executive</option>
                <option value="director">Committee Director</option>
              </select>
            </div>
          </div>
          <div className="field-group"><label>Photo URL</label><input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://…" /></div>
          <div className="field-group">
            <label>Or upload a photo</label>
            <PhotoUploader onUploaded={(url) => setForm((f) => ({ ...f, photo_url: url }))} />
          </div>
          {form.photo_url && (
            <div style={{ margin: "0.4rem 0 0.8rem" }}>
              <img src={form.photo_url} alt="preview" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
            </div>
          )}
          <div className="field-group">
            <label>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              maxLength={2000}
              placeholder="Short bio shown on the team member's profile…"
              style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)", fontFamily: "inherit", resize: "vertical" }}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>{form.bio.length}/2000</div>
          </div>
          {form.kind === "director" && (
            <div className="field-group">
              <label>Assign to committee</label>
              <select value={form.committee_id} onChange={(e) => setForm({ ...form, committee_id: e.target.value })}>
                <option value="">— Select a committee —</option>
                {(committees ?? []).map((c) => (
                  <option key={c.id} value={c.id} disabled={assignedCommitteeIds.has(c.id)}>
                    {c.icon} {c.name}{assignedCommitteeIds.has(c.id) ? " (assigned)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field-group" style={{ maxWidth: 140 }}>
            <label>Sort order</label>
            <input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} />
          </div>
          <div className="wizard-actions">
            {editingId && <button className="btn-secondary" onClick={reset}>Cancel</button>}
            <button className="btn-primary" onClick={save} disabled={saving || !form.name.trim() || !form.role.trim()}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add member"}
            </button>
          </div>
        </div>
      </div>

      <h4 style={{ margin: "1.4rem 0 0.6rem" }}>Executives</h4>
      <TeamList rows={executives} committees={committees ?? []} onEdit={startEdit} onDelete={remove} />

      <h4 style={{ margin: "1.4rem 0 0.6rem" }}>Committee Directors</h4>
      <TeamList rows={directors} committees={committees ?? []} onEdit={startEdit} onDelete={remove} />
    </div>
  );
}
