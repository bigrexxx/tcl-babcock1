import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListBookings,
  adminUpdateBookingStatus,
  adminDeleteBooking,
} from "@/lib/admin.functions";
import { downloadCSV } from "./utils";

const BOOK_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

export function BookingsTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListBookings);
  const upd = useServerFn(adminUpdateBookingStatus);
  const del = useServerFn(adminDeleteBooking);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-bookings"], queryFn: () => list(), refetchInterval: 30000 });
  if (isLoading) return <p style={{ color: "var(--muted)" }}>Loading bookings…</p>;
  const q = search.trim().toLowerCase();
  const rows = (data ?? []).filter((r) => (filter === "all" || r.status === filter) && (!q || r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.package.toLowerCase().includes(q)));

  const quickSet = async (id: string, status: typeof BOOK_STATUSES[number]) => {
    setBusyId(id);
    try { await upd({ data: { id, status } }); qc.invalidateQueries({ queryKey: ["admin-bookings"] }); }
    finally { setBusyId(null); }
  };

  return (
    <div>
      <div className="admin-toolbar">
        <span className="comm-results-count">{rows.length} booking{rows.length !== 1 ? "s" : ""}</span>
        <div className="toolbar-right">
          <input className="admin-input" placeholder="Search name, email, package…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-select">
            <option value="all">All statuses</option>
            {BOOK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-ghost" onClick={() => qc.invalidateQueries({ queryKey: ["admin-bookings"] })} title="Refresh">↻</button>
          <button className="btn-ghost" onClick={() => downloadCSV(`bookings-${Date.now()}.csv`, rows)} title="Export CSV">⤓ CSV</button>
        </div>
      </div>
      <div className="admin-list">
        {rows.length === 0 && <p style={{ color: "var(--muted)" }}>No bookings yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className={"admin-row" + (busyId === r.id ? " busy" : "")}>
            <div className="admin-row-head" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div>
                <strong>{r.full_name}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{r.package} · {r.booking_date} @ {r.time_slot}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span className={"status-badge status-" + r.status}>{r.status}</span>
                <span className={"chev" + (expanded === r.id ? " open" : "")}>▾</span>
              </div>
            </div>
            {expanded === r.id && (
              <div className="admin-row-body anim-in">
                <div className="quick-actions">
                  <button className="pill pill-accept" onClick={() => quickSet(r.id, "confirmed")}>✓ Confirm</button>
                  <button className="pill pill-review" onClick={() => quickSet(r.id, "completed")}>● Complete</button>
                  <button className="pill pill-reject" onClick={() => quickSet(r.id, "cancelled")}>✕ Cancel</button>
                  <a className="pill pill-mail" href={`mailto:${r.email}`}>✉ Email</a>
                </div>
                <div className="review-row"><span className="k">Email</span><span className="v">{r.email}</span></div>
                <div className="review-row"><span className="k">Phone</span><span className="v">{r.phone ?? "—"}</span></div>
                <div className="review-row"><span className="k">Add-ons</span><span className="v">{(r.addons as string[]).join(", ") || "—"}</span></div>
                <div className="review-row"><span className="k">Notes</span><span className="v">{r.notes ?? "—"}</span></div>
                <div className="wizard-actions" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                  <select
                    className="admin-select"
                    value={r.status}
                    onChange={async (e) => {
                      await upd({ data: { id: r.id, status: e.target.value as typeof BOOK_STATUSES[number] } });
                      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
                    }}
                  >
                    {BOOK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    className="btn-secondary"
                    onClick={async () => {
                      if (!confirm("Delete this booking?")) return;
                      await del({ data: { id: r.id } });
                      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
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
