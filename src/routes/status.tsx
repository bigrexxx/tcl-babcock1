import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TclNav } from "@/components/tcl/TclNav";
import { TclFooter } from "@/components/tcl/TclFooter";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Application Status — TCL Babcock" },
      { name: "description", content: "Check the status of your TCL Babcock membership application." },
    ],
  }),
  component: StatusPage,
});

// Status values stored in DB are: pending | reviewing | accepted | rejected
type S = "pending" | "reviewing" | "accepted" | "rejected" | "not_found";

const checkApplicationStatus = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ email: z.string().email() }).parse(input),
  )
  .handler(async ({ data }) => {
    // Use anon client — this query matches by email supplied by the user,
    // and only returns the status string (no PII beyond what they already know).
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
    );
    const { data: rows, error } = await supabase
      .from("applications")
      .select("status")
      .eq("email", data.email.trim().toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return { status: "not_found" as S };
    return { status: rows[0].status as S };
  });

function StatusPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<S | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const checkFn = useServerFn(checkApplicationStatus);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setServerError(null);
    try {
      const res = await checkFn({ data: { email: email.trim() } });
      setResult(res.status);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TclNav variant="back" />
      <div className="page-wrap">
        <div className="status-card">
          <div className="eyebrow center">Application</div>
          <h1>Check your status</h1>
          <form onSubmit={check}>
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "0.8rem 1rem", background: "var(--navy-deep)", border: "1px solid var(--border-mid)", color: "var(--white)", borderRadius: 8 }}
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Checking…" : "Check Status"}
            </button>
          </form>

          {serverError && (
            <div className="field-error" style={{ marginTop: "1rem" }}>{serverError}</div>
          )}

          {result === "not_found" && (
            <>
              <div className="status-badge badge-pending">? Not found</div>
              <p style={{ color: "var(--muted)" }}>
                We couldn't find an application for that email address. Make sure you're using the same email you applied with.
              </p>
            </>
          )}
          {(result === "pending" || result === "reviewing") && (
            <>
              <div className="status-badge badge-pending">⏳ {result === "reviewing" ? "Under review" : "Pending"}</div>
              <p style={{ color: "var(--muted)" }}>Your application is being reviewed. We'll email you within 7 days.</p>
            </>
          )}
          {result === "accepted" && (
            <>
              <div className="status-badge badge-approved">✓ Accepted</div>
              <p style={{ color: "var(--muted)" }}>Welcome to TCL Babcock! Check your email for onboarding details.</p>
            </>
          )}
          {result === "rejected" && (
            <>
              <div className="status-badge badge-rejected">✕ Not selected</div>
              <p style={{ color: "var(--muted)" }}>Unfortunately your application was not successful this cycle. You can re-apply next intake.</p>
            </>
          )}

          <p style={{ marginTop: "2rem", color: "var(--muted)", fontSize: "0.82rem" }}>
            Haven't applied yet? <Link to="/register" style={{ color: "var(--cream)", textDecoration: "underline" }}>Start an application →</Link>
          </p>
        </div>
      </div>
      <TclFooter />
    </>
  );
}
