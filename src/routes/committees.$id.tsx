import { createFileRoute, Link } from "@tanstack/react-router";
import { TclNav } from "@/components/tcl/TclNav";
import { TclFooter } from "@/components/tcl/TclFooter";
import { findCommittee } from "@/lib/tcl-committees";
import { useSiteImages } from "@/lib/tcl-images";

export const Route = createFileRoute("/committees/$id")({
  component: CommitteeDetail,
});

function CommitteeDetail() {
  const { id } = Route.useParams();
  const c = findCommittee(id);
  const images = useSiteImages();

  if (!c) {
    return (
      <>
        <TclNav variant="back" />
        <div className="page-wrap" style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: "1rem" }}>Committee not found</h1>
          <Link to="/" className="btn-primary">← Back to home</Link>
        </div>
        <TclFooter />
      </>
    );
  }

  return (
    <>
      <TclNav variant="back" />
      <div className="page-wrap">
        {images.committee(c.id) && (
          <div className="cd-cover">
            <img src={images.committee(c.id)} alt={c.name} width={1024} height={1024} />
          </div>
        )}
        <div className="cd-hero">
          <div className="ic">{c.icon}</div>
          <div>
            <h1>{c.name}</h1>
            <div className="tag">{c.tagline}</div>
          </div>
        </div>
        <p style={{ color: "var(--muted)", maxWidth: 680, marginBottom: "2rem" }}>{c.desc}</p>

        <div className="cd-card">
          <h3>Director</h3>
          <strong>{c.director.name}</strong>
          <div style={{ color: "var(--cream)", fontSize: "0.85rem", margin: "4px 0" }}>{c.director.role}</div>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{c.director.bio}</p>
        </div>

        <div className="cd-card">
          <h3>Highlights</h3>
          <ul>{c.highlights.map((h) => <li key={h}>✦ {h}</li>)}</ul>
        </div>

        <div className="cd-card" style={{ textAlign: "center" }}>
          <h3>Want to join this committee?</h3>
          <p style={{ color: "var(--muted)", margin: "0.6rem 0 1.2rem" }}>Apply now and select {c.name} during registration.</p>
          <Link to="/register" className="btn-primary">Apply to {c.name} →</Link>
        </div>
      </div>
      <TclFooter />
    </>
  );
}