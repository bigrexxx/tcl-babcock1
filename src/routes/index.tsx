import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TclNav } from "@/components/tcl/TclNav";
import { TclFooter } from "@/components/tcl/TclFooter";
import { ScrollProgress } from "@/components/tcl/ScrollProgress";
import { BackToTop } from "@/components/tcl/BackToTop";
import { CountUp } from "@/components/tcl/CountUp";
import { useReveal } from "@/hooks/use-reveal";
import { COMMITTEES } from "@/lib/tcl-committees";
import { useSiteImages } from "@/lib/tcl-images";
import { listTeamMembers } from "@/lib/team.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TCL Babcock — The Campus Lifestyle" },
      { name: "description", content: "Babcock University's creative student community. Connect, learn, and inspire." },
      { property: "og:title", content: "TCL Babcock — The Campus Lifestyle" },
      { property: "og:description", content: "Babcock University's creative student community. Connect, learn, and inspire." },
    ],
    links: [
      { rel: "canonical", href: "/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "TCL Babcock",
          description: "Babcock University's creative student community.",
          url: "/",
        }),
      },
    ],
  }),
  component: Home,
});

const BENEFITS = [
  { ic: "💬", t: "WhatsApp Community", d: "A buzzing daily community of ambitious Babcock students." },
  { ic: "🎓", t: "TCL Academy", d: "Workshops, masterclasses, and skill clinics every month." },
  { ic: "📸", t: "TCL Studios 25", d: "Pro photo & video studio access at member rates." },
  { ic: "🏆", t: "TCL Awards", d: "Annual recognition for standout student creators." },
  { ic: "🗂️", t: "Digital Portfolio", d: "A showcase profile to share with brands and recruiters." },
  { ic: "🌐", t: "Global Network", d: "Plug into TCL alumni and partner organisations worldwide." },
];

const TESTIMONIALS = [
  { q: "TCL gave me a community that actually pushes me to ship work, not just talk.", a: "— Tomi, 300 Level Computer Science" },
  { q: "From content council to my first paid brand gig in a semester. Wild.", a: "— Bisi, 200 Level Mass Comm" },
  { q: "Studios 25 made my graduation shoot look like a magazine cover.", a: "— Emeka, 400 Level Anatomy" },
];

const FAQS = [
  { q: "Who can join TCL?", a: "Any current Babcock University student. Bring your curiosity — we'll match you to a committee that fits." },
  { q: "Is there a membership fee?", a: "Membership itself is free. Some workshops, merch, and studio sessions have member-friendly rates." },
  { q: "How do I pick a committee?", a: "Browse the 10 committees above. You can express interest in up to two when you register; directors will reach out." },
  { q: "Can non-members book Studios 25?", a: "Yes — but members get priority booking and lower hourly rates. Bookings are handled on the Studios page." },
  { q: "How often does TCL meet?", a: "Each committee runs its own cadence — usually a weekly stand-up plus monthly community events open to all members." },
];

function setMouseSpotlight(e: React.MouseEvent<HTMLDivElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
  e.currentTarget.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
}

function Home() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [profileMember, setProfileMember] = useState<any | null>(null);
  useReveal();
  const images = useSiteImages();
  useEffect(() => { document.title = "TCL Babcock — The Campus Lifestyle"; }, []);

  const teamFn = useServerFn(listTeamMembers);
  const { data: teamData } = useQuery({ queryKey: ["team-public"], queryFn: () => teamFn() });
  const executives = (teamData ?? []).filter((m) => m.kind === "executive");
  const directors = (teamData ?? []).filter((m) => m.kind === "director");

  const categories = ["All", "Creative", "Media", "Operations", "Community", "Tech"];

  const categoryMap: Record<string, string[]> = {
    All: [],
    Creative: ["photography", "content", "marketing"],
    Media: ["social", "content", "marketing"],
    Operations: ["finance", "events", "partnerships"],
    Community: ["sports", "academic", "events"],
    Tech: ["tech"],
  };

  const filteredCommittees = useMemo(() => {
    let list = COMMITTEES;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "All") {
      const ids = categoryMap[activeFilter] || [];
      list = list.filter((c) => ids.includes(c.id));
    }
    return list;
  }, [query, activeFilter]);

  return (
    <>
      <ScrollProgress />
      <TclNav />

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="shape s1" /><div className="shape s2" /><div className="shape s3" />
        <div className="hero-content">
          <div className="hero-pill"><span className="dot-pulse" /> Now Accepting Members — Babcock University</div>
          <div className="hero-logo-big">TCL</div>
          <h1>The Campus Lifestyle</h1>
          <div className="hero-tagline">Connect | Learn | Inspire</div>
          <p className="hero-desc">A creative student community at Babcock University built around ten committees, member workshops, and a working photo & video studio.</p>
          <div className="hero-image">
            <img src={images.hero} alt="TCL Babcock students collaborating" width={1600} height={1024} loading="eager" fetchPriority="high" decoding="async" />
          </div>
          <div className="hero-ctas">
            <Link to="/register" className="btn-primary">Join the Community →</Link>
            <Link to="/studio" className="btn-secondary">Book Studios 25</Link>
          </div>
          <div className="hero-cta-grid">
            <div className="info"><strong>10 Committees</strong><span>Pick the one that matches your fire.</span></div>
            <div className="info"><strong>1 Studio</strong><span>Photo, video, podcast — all on campus.</span></div>
          </div>
          <div className="hero-stats">
            <div className="stat-item"><div className="stat-num"><CountUp to="1000+" /></div><div className="stat-label">Members</div></div>
            <div className="stat-item"><div className="stat-num"><CountUp to="10+" /></div><div className="stat-label">Major Events</div></div>
            <div className="stat-item"><div className="stat-num"><CountUp to="10+" /></div><div className="stat-label">Partnerships</div></div>
            <div className="stat-item"><div className="stat-num"><CountUp to="1" /></div><div className="stat-label">Year</div></div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="about-section">
        <div className="container two-col">
          <div className="reveal">
            <div className="eyebrow">About TCL</div>
            <h2>Built at Babcock. Built for Babcock.</h2>
            <p>TCL is the campus lifestyle community where Babcock's most curious students plug in, build skills, ship real projects, and meet people who'll show up for them long after graduation.</p>
            <Link to="/register" className="btn-primary">Become a Member →</Link>
          </div>
          <div className="reveal">
            <div className="acard"><div className="ic">🎯</div><div><h4>Mission</h4><p>Equip Babcock students with skills, networks, and a stage to create.</p></div></div>
            <div className="acard"><div className="ic">🌍</div><div><h4>Vision</h4><p>A Babcock student body that ships, leads, and inspires at every level.</p></div></div>
            <div className="acard"><div className="ic">🤝</div><div><h4>Partners</h4><p>Brands, alumni, and orgs that invest in our members' growth.</p></div></div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="benefits-section">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow center">Member Benefits</div>
            <h2>Everything you need to grow on campus</h2>
            <p>Real perks. Real community. Real outcomes.</p>
          </div>
          <div className="b-grid">
            {BENEFITS.map((b) => (
              <div key={b.t} className="bcard reveal" onMouseMove={setMouseSpotlight}>
                <div className="ic">{b.ic}</div>
                <h4>{b.t}</h4>
                <p>{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMITTEES */}
      <section id="committees" className="comm-section">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow center">Committees</div>
            <h2>TCL Babcock Committees</h2>
            <p>Ten focused teams. Pick the one that matches your craft.</p>
          </div>

          <div className="comm-search-wrap reveal">
            <div className="comm-search">
              <span className="comm-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search committees..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button className="comm-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                  ✕
                </button>
              )}
            </div>
            <div className="comm-filters">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`comm-filter-chip ${activeFilter === cat ? "active" : ""}`}
                  onClick={() => setActiveFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="comm-results-count">
              Showing {filteredCommittees.length} of {COMMITTEES.length} committees
            </div>
          </div>

          <div className="c-grid">
            {filteredCommittees.map((c) => (
              <Link key={c.id} to="/committees/$id" params={{ id: c.id }} className="comm-card reveal">
                <div className="comm-cover">
                  <div className="comm-cover-inner">
                    {images.committee(c.id) ? (
                      <img src={images.committee(c.id)} alt={c.name} loading="lazy" width={1024} height={1024} />
                    ) : c.icon}
                  </div>
                </div>
                <div className="comm-body">
                  <div className="ic">{c.icon}</div>
                  <h4>{c.name}</h4>
                  <p>{c.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
          {filteredCommittees.length === 0 && (
            <div className="comm-empty reveal">
              <div className="comm-empty-icon">🔎</div>
              <p>No committees match &ldquo;{query}&rdquo;{activeFilter !== "All" ? ` in ${activeFilter}` : ""}.</p>
              <button className="btn-secondary" onClick={() => { setQuery(""); setActiveFilter("All"); }}>
                Clear filters
              </button>
            </div>
          )}
          <div className="structure-note reveal">
            <strong>Reporting Chain:</strong> Committee Members → Directors → Executive Council → President. Each director leads one of the ten committees and reports to the Vice President.
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="team-section">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow center">The People</div>
            <h2>Meet the TCL Babcock Team</h2>
          </div>
          <div className="sub-label">Leadership</div>
          <div className="t-grid">
            {executives.map((p) => (
              <div key={p.id} className="tcard reveal" onClick={() => setProfileMember(p)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setProfileMember(p); }}>
                <div className="avatar">
                  {p.photo_url
                    ? <img src={p.photo_url} alt={p.name} loading="lazy" />
                    : <span>{p.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</span>}
                </div>
                <h5>{p.name}</h5>
                <div className="role">{p.role}</div>
                {p.department && <div className="dept">{p.department}</div>}
              </div>
            ))}
          </div>
          <div className="sub-label">Committee Directors</div>
          {directors.length > 0 ? (
            <div className="t-grid">
              {directors.map((p) => {
                const committee = COMMITTEES.find((c) => c.id === p.committee_id);
                return (
                  <div key={p.id} className="tcard reveal" onClick={() => setProfileMember({ ...p, _committeeName: committee?.name })} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setProfileMember({ ...p, _committeeName: committee?.name }); }}>
                    <div className="avatar">
                      {p.photo_url
                        ? <img src={p.photo_url} alt={p.name} loading="lazy" />
                        : <span>{p.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</span>}
                    </div>
                    <h5>{p.name}</h5>
                    <div className="role">{p.role}</div>
                    {committee && <div className="dept">{committee.name}</div>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dir-note reveal">
              Each of TCL's ten committees is led by a director responsible for projects, members, and outcomes.
              <div className="chips">
                <span className="chip">10 Directors</span>
                <span className="chip">10 Committees</span>
                <span className="chip">Committee Members</span>
              </div>
            </div>
          )}
          <div className="join-note">Want to join a committee? <Link to="/register">Register as a member →</Link></div>
        </div>
      </section>

      {profileMember && (
        <div className="profile-overlay" onClick={() => setProfileMember(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="profile-close" onClick={() => setProfileMember(null)} aria-label="Close">✕</button>
            <div className="profile-photo">
              {profileMember.photo_url
                ? <img src={profileMember.photo_url} alt={profileMember.name} />
                : <span>{profileMember.name.split(" ").map((s: string) => s[0]).join("").slice(0, 2)}</span>}
            </div>
            <h3>{profileMember.name}</h3>
            <div className="profile-role">{profileMember.role}</div>
            {(profileMember.department || profileMember._committeeName) && (
              <div className="profile-dept">{profileMember._committeeName || profileMember.department}</div>
            )}
            {profileMember.bio
              ? <p className="profile-bio">{profileMember.bio}</p>
              : <p className="profile-bio-empty">No bio yet.</p>}
          </div>
        </div>
      )}

      {/* STUDIO */}
      <section id="studio" className="studio-section">
        <div className="container studio-layout">
          <div className="studio-visual reveal">
            <div className="studio-img">
              <img src={images.studio} alt="TCL Studios 25" loading="lazy" width={1600} height={1024} />
            </div>
            <h4>TCL Studios 25</h4>
            <div className="studio-tags">
              {["Portrait Photography","Brand Shoots","Reels & Videos","Course Photos","Event Coverage","Graduation Shoots"].map((t) => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
          </div>
          <div className="reveal">
            <div className="eyebrow">TCL Studios 25</div>
            <h2>A working studio. Right on campus.</h2>
            <p>Pro lighting, multiple backdrops, an acoustic podcast booth, and a lifestyle set — at member-friendly prices.</p>
            <ul className="perks">
              <li>✦ Pro lighting & grip</li>
              <li>✦ 5 backdrops, lifestyle set</li>
              <li>✦ Podcast booth with SM7B mics</li>
              <li>✦ Same-day edit add-ons</li>
            </ul>
            <div className="price-chips">
              <div className="price-chip">Per Hour<strong>₦15,000</strong></div>
              <div className="price-chip">Half Day<strong>₦45,000</strong></div>
              <div className="price-chip">Full Day<strong>₦80,000</strong></div>
            </div>
            <Link to="/studio" className="btn-primary">Book a Session →</Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="test-section">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow center">Members</div>
            <h2>What Babcock students say</h2>
          </div>
          <div className="test-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="test-card reveal">
                <blockquote>"{t.q}"</blockquote>
                <cite>{t.a}</cite>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="faq-section">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow center">FAQ</div>
            <h2>Common questions</h2>
            <p>Everything you might be wondering before you join.</p>
          </div>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <details key={i} className="faq-item reveal">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <TclFooter />
      <BackToTop />
    </>
  );
}
