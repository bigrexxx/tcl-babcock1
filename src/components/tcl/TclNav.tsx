import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useScrollNav } from "@/hooks/use-scroll-nav";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "committees", label: "Committees" },
  { id: "team", label: "Team" },
  { id: "studio", label: "Studios" },
];

function Logo() {
  return (
    <Link to="/" className="tnav-logo">
      <span className="tnav-logo-mark">TCL</span>
      <span className="tnav-logo-text">
        <strong>Babcock</strong>
        The Campus Lifestyle
      </span>
    </Link>
  );
}

export function TclNav({ variant = "main" }: { variant?: "main" | "back" }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useScrollNav();

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (variant === "back") {
    return (
      <nav className={"tnav" + (scrolled ? " scrolled" : "")}>
        <div className="tnav-inner">
          <Logo />
          <Link to="/" className="back-link" style={{ marginLeft: "auto" }}>
            ← Back to main site
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className={"tnav" + (scrolled ? " scrolled" : "")}>
        <div className="tnav-inner">
          <Logo />
          <div className="nav-links">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={"#" + s.id}
                className={active === s.id ? "active" : ""}
                onClick={(e) => { e.preventDefault(); scrollTo(s.id); }}
              >
                {s.label}
              </a>
            ))}
            <Link to="/register">Join</Link>
            <Link to="/status">My Application</Link>
            <Link to="/auth">Admin</Link>
          </div>
          <Link to="/register" className="btn-primary nav-cta" style={{ padding: "0.55rem 1.2rem", fontSize: "0.82rem" }}>
            Join Now
          </Link>
          <button className="hamburger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? "✕" : "☰"}
          </button>
        </div>
        <div className={"mobile-menu" + (open ? " open" : "")}>
          {SECTIONS.map((s) => (
            <a key={s.id} href={"#" + s.id} onClick={(e) => { e.preventDefault(); scrollTo(s.id); }}>
              {s.label}
            </a>
          ))}
          <Link to="/register" onClick={() => setOpen(false)}>Join</Link>
          <Link to="/status" onClick={() => setOpen(false)}>My Application</Link>
          <Link to="/auth" onClick={() => setOpen(false)}>Admin</Link>
        </div>
      </nav>
    </>
  );
}