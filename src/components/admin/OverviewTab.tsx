import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListApplications, adminListBookings } from "@/lib/admin.functions";

type TopTab = "overview" | "applications" | "bookings" | "committees" | "team" | "images";

export function OverviewTab({ onJump }: { onJump: (t: TopTab) => void }) {
  const qc = useQueryClient();
  const apps = useServerFn(adminListApplications);
  const bks = useServerFn(adminListBookings);
  const { data: appData, isLoading: aL } = useQuery({ queryKey: ["admin-apps"], queryFn: () => apps(), refetchInterval: 30000 });
  const { data: bkData, isLoading: bL } = useQuery({ queryKey: ["admin-bookings"], queryFn: () => bks(), refetchInterval: 30000 });

  const stats = useMemo(() => {
    const a = appData ?? []; const b = bkData ?? [];
    const countBy = <T extends { status: string }>(arr: T[], s: string) => arr.filter((x) => x.status === s).length;
    const last7 = (arr: { created_at: string }[]) => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
        return { label: d.toLocaleDateString(undefined, { weekday: "short" }), ts: d.getTime(), count: 0 };
      });
      arr.forEach((r) => {
        const t = new Date(r.created_at).setHours(0, 0, 0, 0);
        const slot = days.find((d) => d.ts === t); if (slot) slot.count++;
      });
      return days;
    };
    const byCommittee: Record<string, number> = {};
    a.forEach((r) => { byCommittee[r.committee_id] = (byCommittee[r.committee_id] ?? 0) + 1; });
    const topCommittees = Object.entries(byCommittee).sort((x, y) => y[1] - x[1]).slice(0, 5);
    return {
      appsTotal: a.length,
      appsPending: countBy(a, "pending"),
      appsAccepted: countBy(a, "accepted"),
      bksTotal: b.length,
      bksPending: countBy(b, "pending"),
      bksConfirmed: countBy(b, "confirmed"),
      appsTrend: last7(a),
      bksTrend: last7(b),
      topCommittees,
    };
  }, [appData, bkData]);

  if (aL || bL) return <p style={{ color: "var(--muted)" }}>Loading overview…</p>;

  const maxTrend = Math.max(1, ...stats.appsTrend.map((d) => d.count), ...stats.bksTrend.map((d) => d.count));

  return (
    <div className="admin-overview">
      <div className="stat-grid">
        <button className="stat-card stat-card-btn" onClick={() => onJump("applications")}>
          <div className="stat-label">Applications</div>
          <div className="stat-value">{stats.appsTotal}</div>
          <div className="stat-sub"><span className="dot dot-pending" /> {stats.appsPending} pending · <span className="dot dot-accepted" /> {stats.appsAccepted} accepted</div>
        </button>
        <button className="stat-card stat-card-btn" onClick={() => onJump("bookings")}>
          <div className="stat-label">Studio Bookings</div>
          <div className="stat-value">{stats.bksTotal}</div>
          <div className="stat-sub"><span className="dot dot-pending" /> {stats.bksPending} pending · <span className="dot dot-confirmed" /> {stats.bksConfirmed} confirmed</div>
        </button>
        <div className="stat-card">
          <div className="stat-label">Conversion</div>
          <div className="stat-value">{stats.appsTotal ? Math.round((stats.appsAccepted / stats.appsTotal) * 100) : 0}%</div>
          <div className="stat-sub">Accepted / total applications</div>
        </div>
        <button className="stat-card stat-card-btn" onClick={() => { qc.invalidateQueries({ queryKey: ["admin-apps"] }); qc.invalidateQueries({ queryKey: ["admin-bookings"] }); }}>
          <div className="stat-label">Refresh</div>
          <div className="stat-value" style={{ fontSize: "1.6rem" }}>↻</div>
          <div className="stat-sub">Pull latest data</div>
        </button>
      </div>

      <div className="overview-grid">
        <div className="overview-card">
          <div className="overview-card-head"><h4>Last 7 days</h4><span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>Apps vs Bookings</span></div>
          <div className="trend-chart">
            {stats.appsTrend.map((d, i) => (
              <div className="trend-col" key={d.ts}>
                <div className="trend-bars">
                  <div className="trend-bar bar-apps" style={{ height: `${(d.count / maxTrend) * 100}%` }} title={`${d.count} apps`} />
                  <div className="trend-bar bar-bks" style={{ height: `${(stats.bksTrend[i].count / maxTrend) * 100}%` }} title={`${stats.bksTrend[i].count} bookings`} />
                </div>
                <div className="trend-label">{d.label}</div>
              </div>
            ))}
          </div>
          <div className="legend"><span><i className="sw bar-apps" /> Applications</span><span><i className="sw bar-bks" /> Bookings</span></div>
        </div>

        <div className="overview-card">
          <div className="overview-card-head"><h4>Top committees</h4><span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>By applications</span></div>
          {stats.topCommittees.length === 0 && <p style={{ color: "var(--muted)" }}>No applications yet.</p>}
          {stats.topCommittees.map(([id, n]) => (
            <div className="rank-row" key={id}>
              <span className="rank-name">{id}</span>
              <div className="rank-bar-wrap"><div className="rank-bar" style={{ width: `${(n / stats.topCommittees[0][1]) * 100}%` }} /></div>
              <span className="rank-count">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
