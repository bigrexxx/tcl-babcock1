import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TclNav } from "@/components/tcl/TclNav";
import { TclFooter } from "@/components/tcl/TclFooter";
import { getMyRole } from "@/lib/admin.functions";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { ApplicationsTab } from "@/components/admin/ApplicationsTab";
import { BookingsTab } from "@/components/admin/BookingsTab";
import { CommitteesTab } from "@/components/admin/CommitteesTab";
import { TeamTab } from "@/components/admin/TeamTab";
import { ImagesTab } from "@/components/admin/ImagesTab";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin — TCL Babcock" }],
  }),
  component: AdminPage,
});

type TopTab = "overview" | "applications" | "bookings" | "committees" | "team" | "images";

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TopTab>("overview");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const roleFn = useServerFn(getMyRole);
  const { data: roleData, isLoading: roleLoading } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => roleFn(),
  });

  useEffect(() => {
    const id = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["admin-apps"] });
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-committees"] });
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(id);
  }, [qc]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (roleLoading) {
    return (
      <>
        <TclNav variant="back" />
        <div className="page-wrap"><p style={{ textAlign: "center", color: "var(--muted)" }}>Loading…</p></div>
      </>
    );
  }

  if (!roleData?.isAdmin) {
    return (
      <>
        <TclNav variant="back" />
        <div className="page-wrap">
          <div className="wizard-card" style={{ maxWidth: 520, margin: "2rem auto", textAlign: "center" }}>
            <h2>Access Denied</h2>
            <p style={{ color: "var(--muted)", margin: "1rem 0" }}>
              Your account is signed in but doesn't have admin access. Ask an existing TCL admin to grant your account the <code>admin</code> role in the database, then refresh this page.
            </p>
            <div className="wizard-actions" style={{ justifyContent: "center", gap: "0.6rem" }}>
              <button className="btn-secondary" onClick={signOut}>Sign out</button>
              <Link to="/" className="btn-primary">Back to site</Link>
            </div>
          </div>
        </div>
        <TclFooter />
      </>
    );
  }

  return (
    <>
      <TclNav variant="back" />
      <div className="page-wrap">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <div className="eyebrow">Admin Dashboard</div>
            <h2 style={{ margin: "0.4rem 0 0" }}>TCL Operations</h2>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.3rem" }}>
              Last updated {lastUpdated.toLocaleTimeString()} · Auto-refresh every 30s
            </div>
          </div>
          <button className="btn-secondary" onClick={signOut}>Sign out</button>
        </div>

        <div className="admin-tabs">
          {(["overview", "applications", "bookings", "committees", "team", "images"] as TopTab[]).map((t) => (
            <button key={t} className={"admin-tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab onJump={(t) => setTab(t)} />}
        {tab === "applications" && <ApplicationsTab />}
        {tab === "bookings" && <BookingsTab />}
        {tab === "committees" && <CommitteesTab />}
        {tab === "team" && <TeamTab />}
        {tab === "images" && <ImagesTab />}
      </div>
      <TclFooter />
    </>
  );
}
