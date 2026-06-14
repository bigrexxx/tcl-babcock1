import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TclNav } from "@/components/tcl/TclNav";
import { TclFooter } from "@/components/tcl/TclFooter";
import { COMMITTEES, findCommittee, type Question } from "@/lib/tcl-committees";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Join TCL Babcock — Membership Application" },
      { name: "description", content: "Apply to join one of TCL Babcock's ten committees." },
    ],
  }),
  component: RegisterPage,
});

const STORAGE_KEY = "tcl_register_state_v1";

const GENERAL_Q: Question[] = [
  { id: "name", type: "text", label: "Full Name", required: true },
  { id: "email", type: "email", label: "Email Address", required: true },
  { id: "whatsapp", type: "tel", label: "WhatsApp Number", required: true },
  { id: "dept", type: "text", label: "Department / Course of Study", required: true },
  { id: "level", type: "select", label: "Level", required: true, options: ["100 Level","200 Level","300 Level","400 Level","500 Level","Postgraduate"] },
  { id: "hear", type: "select", label: "How did you hear about TCL?", required: true, options: ["Social Media","Friend/Classmate","Campus Flyer","Event","Other"] },
  { id: "why", type: "textarea", label: "Why do you want to join TCL?", required: true },
];

type Values = Record<string, any>;

function loadState() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}

function RegisterPage() {
  const [step, setStep] = useState(1);
  const [committeeId, setCommitteeId] = useState<string>("");
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadState();
    if (s) { setStep(s.step || 1); setCommitteeId(s.committeeId || ""); setValues(s.values || {}); }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, committeeId, values }));
    }
  }, [step, committeeId, values]);

  const committee = useMemo(() => findCommittee(committeeId), [committeeId]);

  const setVal = (id: string, v: any) => setValues((p) => ({ ...p, [id]: v }));

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    const all = [...GENERAL_Q, ...(committee?.questions || [])];
    all.forEach((q) => {
      if (!q.required) return;
      const v = values[q.id];
      if (q.type === "checkbox") {
        if (!Array.isArray(v) || v.length === 0) errs[q.id] = "Please select at least one";
      } else if (v === undefined || v === null || v === "") {
        errs[q.id] = "Required";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!committee) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const generalIds = new Set(GENERAL_Q.map((q) => q.id));
      const answers: Record<string, unknown> = {};
      Object.entries(values).forEach(([k, v]) => {
        if (!generalIds.has(k)) answers[k] = v;
      });
      const { error } = await supabase.from("applications").insert({
        committee_id: committee.id,
        full_name: String(values.name ?? ""),
        email: String(values.email ?? ""),
        phone: values.whatsapp ? String(values.whatsapp) : null,
        level: values.level ? String(values.level) : null,
        hall: values.dept ? String(values.dept) : null,
        motivation: values.why ? String(values.why) : null,
        answers: answers as never,
      });
      if (error) throw error;
      setDone(true);
      if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1); setCommitteeId(""); setValues({}); setErrors({}); setDone(false);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      <TclNav variant="back" />
      <div className="page-wrap">
        {done ? (
          <div className="wizard-card success-card">
            <div className="success-check">✓</div>
            <h2>Application Submitted!</h2>
            <p style={{ color: "var(--muted)", margin: "0.8rem 0 0.4rem" }}>{values.name}</p>
            <p style={{ color: "var(--cream)" }}>{committee?.icon} {committee?.name}</p>
            <p style={{ color: "var(--muted)", margin: "1.5rem auto", maxWidth: 420 }}>
              We'll review your application and email you within 7 days. Check your inbox (and WhatsApp) for next steps.
            </p>
            <button className="btn-secondary" onClick={reset}>Start a new application</button>
          </div>
        ) : (
          <>
            <div className="steps">
              {[1,2,3].map((n) => (
                <div key={n} className={"step-pill" + (step === n ? " active" : "")}>
                  <span className="num">{n}</span>
                  {n === 1 ? "Committee" : n === 2 ? "Details" : "Review"}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="wizard-card">
                <h2>Choose a Committee</h2>
                <p className="sub">Pick the team that matches your craft. You can change this later.</p>
                <div className="committee-pick-grid">
                  {COMMITTEES.map((c) => (
                    <button key={c.id} type="button"
                      className={"pick-card" + (committeeId === c.id ? " selected" : "")}
                      onClick={() => setCommitteeId(c.id)}>
                      <div className="ic">{c.icon}</div>
                      <h4>{c.name}</h4>
                      <div className="tag">{c.tagline}</div>
                      <div className="desc">{c.desc}</div>
                      {committeeId === c.id && <span className="check">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="wizard-actions">
                  <span />
                  <button className="btn-primary" disabled={!committeeId} onClick={() => setStep(2)}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && committee && (
              <div className="wizard-card">
                <h2>Your Details</h2>
                <p className="sub">Tell us about you and why {committee.name} is the right fit.</p>
                <div className="section-title">General</div>
                {GENERAL_Q.map((q) => (
                  <Field key={q.id} q={q} value={values[q.id]} onChange={(v) => setVal(q.id, v)} error={errors[q.id]} />
                ))}
                <div className="section-title">{committee.icon} {committee.name} questions</div>
                {committee.questions.map((q) => (
                  <Field key={q.id} q={q} value={values[q.id]} onChange={(v) => setVal(q.id, v)} error={errors[q.id]} />
                ))}
                <div className="wizard-actions">
                  <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-primary" onClick={() => { if (validateStep2()) setStep(3); }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && committee && (
              <div className="wizard-card">
                <h2>Review & Submit</h2>
                <p className="sub">Double-check your answers before submitting.</p>
                <div className="committee-banner">
                  <div className="ic">{committee.icon}</div>
                  <div>
                    <strong>{committee.name}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{committee.tagline}</div>
                  </div>
                </div>
                {[...GENERAL_Q, ...committee.questions].map((q) => (
                  <div key={q.id} className="review-row">
                    <span className="k">{q.label}</span>
                    <span className="v">{formatVal(values[q.id])}</span>
                  </div>
                ))}
                <div className="wizard-actions">
                  <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn-primary" disabled={submitting} onClick={submit}>
                    {submitting ? "Submitting…" : "Submit Application"}
                  </button>
                </div>
                {submitError && <div className="field-error" style={{ marginTop: "1rem" }}>{submitError}</div>}
              </div>
            )}
          </>
        )}
        <p style={{ textAlign: "center", marginTop: "2rem", color: "var(--muted)", fontSize: "0.85rem" }}>
          Already applied? <Link to="/status" style={{ color: "var(--cream)", textDecoration: "underline" }}>Check your status</Link>
        </p>
      </div>
      <TclFooter />
    </>
  );
}

function formatVal(v: any): string {
  if (v === undefined || v === null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function Field({ q, value, onChange, error }: { q: Question; value: any; onChange: (v: any) => void; error?: string }) {
  return (
    <div className="field-group">
      <label>{q.label}{q.required && <span style={{ color: "#f87171" }}> *</span>}</label>
      {renderInput(q, value, onChange)}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

function renderInput(q: Question, value: any, onChange: (v: any) => void) {
  if (q.type === "textarea") {
    return <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={(q as any).placeholder} />;
  }
  if (q.type === "select") {
    return (
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {(q as any).options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (q.type === "radio") {
    return (
      <div className="field-options">
        {(q as any).options.map((o: string) => (
          <label key={o} className={"opt" + (value === o ? " checked" : "")}>
            <input type="radio" name={q.id} checked={value === o} onChange={() => onChange(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    );
  }
  if (q.type === "checkbox") {
    const arr: string[] = Array.isArray(value) ? value : [];
    return (
      <div className="field-options">
        {(q as any).options.map((o: string) => {
          const checked = arr.includes(o);
          return (
            <label key={o} className={"opt" + (checked ? " checked" : "")}>
              <input type="checkbox" checked={checked} onChange={() => {
                onChange(checked ? arr.filter((x) => x !== o) : [...arr, o]);
              }} />
              <span>{o}</span>
            </label>
          );
        })}
      </div>
    );
  }
  if (q.type === "scale") {
    const sq = q as Extract<Question, { type: "scale" }>;
    const nums = Array.from({ length: sq.max - sq.min + 1 }, (_, i) => sq.min + i);
    return (
      <div className="scale-row">
        <span className="scale-label">{sq.minLabel}</span>
        {nums.map((n) => (
          <button key={n} type="button" className={"scale-btn" + (value === n ? " active" : "")} onClick={() => onChange(n)}>{n}</button>
        ))}
        <span className="scale-label">{sq.maxLabel}</span>
      </div>
    );
  }
  return <input type={q.type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={(q as any).placeholder} />;
}