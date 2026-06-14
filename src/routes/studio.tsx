import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TclNav } from "@/components/tcl/TclNav";
import { TclFooter } from "@/components/tcl/TclFooter";
import { formatNaira } from "@/lib/tcl-committees";
import { supabase } from "@/integrations/supabase/client";
import { useSiteImages } from "@/lib/tcl-images";
import { getBookedSlots } from "@/lib/studio.functions";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "TCL Studios 25 — Book a Session" },
      { name: "description", content: "Professional photo, video, and podcast studio on Babcock campus." },
    ],
  }),
  component: StudioPage,
});

const PACKAGES = [
  { id: "hourly", ic: "📸", name: "Hourly", price: 15000, duration: "1 hr", perks: ["Studio access","Basic lighting","1 backdrop","Props"] },
  { id: "half", ic: "🎬", name: "Half Day", price: 45000, duration: "4 hrs", featured: true, perks: ["Full lighting","Multiple backdrops","Props + makeup mirror","1 free retouch"] },
  { id: "full", ic: "🎥", name: "Full Day", price: 80000, duration: "8 hrs", perks: ["All-day access","Full lighting + grip","All backdrops","Assistant","3 free retouches"] },
  { id: "podcast", ic: "🎙️", name: "Podcast", price: 20000, duration: "2 hrs", perks: ["Acoustic booth","4 SM7B mics","Multi-track recording","Basic edit"] },
];

const ADDONS = [
  ["Extra hour", 5000], ["Pro photographer", 15000], ["Videographer", 20000],
  ["MUA on set", 12000], ["Same-day edit", 10000], ["Drone shot", 8000],
] as const;

const SHOWCASE = [
  { ic: "💡", t: "Pro Lighting", d: "Aputure key lights, RGB accents, full softbox kit." },
  { ic: "🎨", t: "5 Backdrops", d: "Cream, navy, white, textured, and chroma green." },
  { ic: "🎧", t: "Audio Booth", d: "Treated acoustic booth with broadcast mics." },
  { ic: "🪑", t: "Lifestyle Set", d: "Furnished set with sofa, desk, and shelf styling." },
];

const SLOTS = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM"];

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function StudioPage() {
  const images = useSiteImages();
  const [pkg, setPkg] = useState("half");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");

  const fetchBookedSlots = useServerFn(getBookedSlots);
  const { data: bookedSlots = [], isFetching: slotsLoading } = useQuery({
    queryKey: ["booked-slots", date],
    queryFn: () => fetchBookedSlots({ data: { date } }),
    enabled: !!date,
    staleTime: 30_000,
  });
  const BOOKED = new Set(bookedSlots);
  const [form, setForm] = useState({ name: "", email: "", phone: "", project: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { error } = await supabase.from("bookings").insert({
        full_name: form.name,
        email: form.email,
        phone: form.phone,
        package: sel?.name ?? pkg,
        addons: selectedAddons as never,
        booking_date: date,
        time_slot: slot,
        notes: [form.project, form.notes].filter(Boolean).join("\n\n") || null,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sel = PACKAGES.find((p) => p.id === pkg);

  return (
    <>
      <TclNav variant="back" />
      <div className="page-wrap">
        <div className="studio-hero-img">
          <img src={images.studio} alt="TCL Studios 25 — lights and backdrops" width={1600} height={1024} />
        </div>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div className="eyebrow center">TCL Studios 25</div>
          <h2 style={{ fontSize: "2.2rem", margin: "0.5rem 0" }}>Professional photo & video. Right on campus.</h2>
          <p style={{ color: "var(--muted)", maxWidth: 560, margin: "0 auto" }}>
            A working studio for portraits, brand shoots, reels, podcasts, and graduation sessions — at member-friendly rates.
          </p>
        </div>

        <div className="section-title">The Studio</div>
        <div className="showcase-grid">
          {SHOWCASE.map((s) => (
            <div key={s.t} className="showcase-card"><div className="ic">{s.ic}</div><h4>{s.t}</h4><p>{s.d}</p></div>
          ))}
        </div>

        <div className="section-title">Packages</div>
        <div className="pkg-grid">
          {PACKAGES.map((p) => (
            <button key={p.id} type="button"
              className={"pkg-card" + (p.featured ? " featured" : "") + (pkg === p.id ? " selected" : "")}
              onClick={() => setPkg(p.id)}>
              {p.featured && <span className="pkg-badge">Most Popular</span>}
              <div className="ic">{p.ic}</div>
              <h4>{p.name}</h4>
              <div className="price">{formatNaira(p.price)}</div>
              <div className="duration">{p.duration}</div>
              <ul>{p.perks.map((x) => <li key={x}>✦ {x}</li>)}</ul>
            </button>
          ))}
        </div>

        <div className="section-title">Add-ons</div>
        <div className="addon-grid">
          {ADDONS.map(([n, p]) => (
            <button
              key={n}
              type="button"
              className={"addon-chip" + (selectedAddons.includes(n) ? " selected" : "")}
              onClick={() =>
                setSelectedAddons((prev) =>
                  prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
                )
              }
            >
              <span>{n}</span><strong>{formatNaira(p as number)}</strong>
            </button>
          ))}
        </div>

        {done ? (
          <div className="wizard-card success-card">
            <div className="success-check">✓</div>
            <h2>Booking Confirmed!</h2>
            <p style={{ color: "var(--cream)", marginTop: "0.6rem" }}>{sel?.ic} {sel?.name} · {date} · {slot}</p>
            <p style={{ color: "var(--muted)", margin: "1.2rem auto", maxWidth: 420 }}>
              We'll email a confirmation and prep checklist within an hour.
            </p>
            <button className="btn-secondary" onClick={() => { setDone(false); setForm({ name:"", email:"", phone:"", project:"", notes:"" }); setSlot(""); setDate(""); }}>
              Book another session
            </button>
          </div>
        ) : (
          <form className="wizard-card" onSubmit={submit} style={{ marginTop: "1rem" }}>
            <h2>Book your session</h2>
            <p className="sub">Selected: <strong style={{ color: "var(--white)" }}>{sel?.name}</strong> — {formatNaira(sel!.price)}</p>

            <div className="field-group">
              <label>Date</label>
              <input type="date" min={todayStr()} required value={date} onChange={(e) => { setDate(e.target.value); setSlot(""); }} />
            </div>

            <div className="field-group">
              <label>Time slot</label>
              <div className="slot-grid">
                {slotsLoading && <p style={{ color: "var(--muted)", fontSize: "0.82rem", gridColumn: "1/-1" }}>Checking availability…</p>}
                {SLOTS.map((s) => (
                  <button key={s} type="button" className={"slot" + (slot === s ? " selected" : "") + (BOOKED.has(s) ? " booked" : "")}
                    disabled={BOOKED.has(s) || slotsLoading} onClick={() => setSlot(s)} title={BOOKED.has(s) ? "Already booked" : undefined}>{s}</button>
                ))}
              </div>
            </div>

            <div className="field-group"><label>Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field-group"><label>Email</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field-group"><label>Phone</label><input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field-group"><label>Project description</label><textarea required value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} /></div>
            <div className="field-group"><label>Notes (optional)</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

            <div className="wizard-actions">
              <span />
              <button className="btn-primary" type="submit" disabled={submitting || !date || !slot}>
                {submitting ? "Booking…" : "Book Session →"}
              </button>
            </div>
            {submitError && <div className="field-error" style={{ marginTop: "1rem" }}>{submitError}</div>}
          </form>
        )}
      </div>
      <TclFooter />
    </>
  );
}