import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TclFooter } from "@/components/tcl/TclFooter";
import { TclNav } from "@/components/tcl/TclNav";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TCL Babcock Admin" },
      { name: "description", content: "Sign in to access the TCL Babcock admin dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/admin", replace: true });
    });
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TclNav variant="back" />
      <div className="page-wrap">
        <div className="wizard-card" style={{ maxWidth: 460, margin: "2rem auto" }}>
          <div className="eyebrow">Admin Access</div>
          <h2>Sign in</h2>
          <p className="sub">Authorized TCL leads only. Sign in to view applications and bookings.</p>
          <form onSubmit={submit}>
            <div className="field-group">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field-group">
              <label>Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div className="field-error" style={{ marginBottom: "1rem" }}>{error}</div>}
            <div className="wizard-actions">
              <button className="btn-primary" type="submit" disabled={busy}>
                {busy ? "…" : "Sign in"}
              </button>
            </div>
          </form>
          <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>
            <Link to="/" style={{ color: "var(--cream)" }}>← Back to site</Link>
          </p>
        </div>
      </div>
      <TclFooter />
    </>
  );
}