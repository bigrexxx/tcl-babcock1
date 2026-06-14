import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListApplications,
  adminUpdateApplicationStatus,
  adminDeleteApplication,
} from "@/lib/admin.functions";
import { downloadCSV } from "./utils";

const APP_STATUSES = ["pending", "reviewing", "accepted", "rejected"] as const;

export function ApplicationsTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListApplications);
  const upd = useServerFn(adminUpdateApplicationStatus);
  const del = useServerFn(adminDeleteApplication);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-apps"], queryFn: () => list(), refetchInterval: 30000 });

  if (isLoading) return <p style={{ color: "var(--muted)" }}>Loading applications…</p>;
  const q = search.trim().toLowerCase();
  const rows = (data ?? []).filter((r) => (filter === "all" || r.status === filter) && (!q || r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.committee_id.toLowerCase().includes(q)));

  const quickSet = async (id: string, status: typeof APP_STATUSES[number]) => {
    setBusyId(id);
    try { await upd({ data: { id, status } }); qc.invalidateQueries({ queryKey: ["admin-apps"] }); }
    finally { setBusyId(null); }
  };

  return (
    <div>
      <div className="admin-toolbar">
        <span className="comm-results-count">{rows.length} application{rows.length !== 1 ? "s" : ""}</span>
        <div className="toolbar-right">
          <input className="admin-input" placeholder="Search name, email, committee…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-select">
            <option value="all">All statuses</option>
            {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-ghost" onClick={() => qc.invalidateQueries({ queryKey: ["admin-apps"] })} title="Refresh">↻</button>
          <button className="btn-ghost" onClick={() => downloadCSV(`applications-${Date.now()}.csv`, rows)} title="Export CSV">⤓ CSV</button>
        </div>
      </div>
      <div className="admin-list">
        {rows.length === 0 && <p style={{ color: "var(--muted)" }}>No applications yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className={"admin-row" + (busyId === r.id ? " busy" : "")}>
            <div className="admin-row-head" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div>
                <strong>{r.full_name}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{r.email} · {r.committee_id}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span className={"status-badge status-" + r.status}>{r.status}</span>
                <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                <span className={"chev" + (expanded === r.id ? " open" : "")}>▾</span>
              </div>
            </div>
            {expanded === r.id && (
              <div className="admin-row-body anim-in">
                <div className="quick-actions">
                  <button className="pill pill-accept" onClick={() => quickSet(r.id, "accepted")}>✓ Accept</button>
                  <button className="pill pill-review" onClick={() => quickSet(r.id, "reviewing")}>◐ Review</button>
                  <button className="pill pill-reject" onClick={() => quickSet(r.id, "rejected")}>✕ Reject</button>
                  <a className="pill pill-mail" href={`mailto:${r.email}`}>✉ Email</a>
                </div>
                <div className="review-row"><span className="k">Phone</span><span className="v">{r.phone ?? "—"}</span></div>
                <div className="review-row"><span className="k">Level</span><span className="v">{r.level ?? "—"}</span></div>
                <div className="review-row"><span className="k">Hall</span><span className="v">{r.hall ?? "—"}</span></div>
                <div className="review-row"><span className="k">Motivation</span><span className="v">{r.motivation ?? "—"}</span></div>
                {Object.entries(r.answers as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="review-row">
                    <span className="k">{k}</span>
                    <span className="v">{Array.isArray(v) ? v.join(", ") : String(v ?? "—")}</span>
                  </div>
                ))}
                <div className="wizard-actions" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                  <select
                    className="admin-select"
                    value={r.status}
                    onChange={async (e) => {
                      await upd({ data: { id: r.id, status: e.target.value as typeof APP_STATUSES[number] } });
                      qc.invalidateQueries({ queryKey: ["admin-apps"] });
                    }}
                  >
                    {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    className="btn-secondary"
                    onClick={async () => {
                      if (!confirm("Delete this application?")) return;
                      await del({ data: { id: r.id } });
                      qc.invalidateQueries({ queryKey: ["admin-apps"] });
                    }}
                  >Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
