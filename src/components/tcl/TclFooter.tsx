import { Link } from "@tanstack/react-router";

export function TclFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="tnav-logo" style={{ marginBottom: "1rem" }}>
            <span className="tnav-logo-mark">TCL</span>
            <span className="tnav-logo-text"><strong>Babcock</strong>The Campus Lifestyle</span>
          </div>
          <p>Babcock University's creative student community — connecting, learning, and inspiring the next generation of campus leaders.</p>
        </div>
        <div>
          <h5>Navigation</h5>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/register">Join TCL</Link></li>
            <li><Link to="/status">My Application</Link></li>
            <li><a href="#about">About</a></li>
          </ul>
        </div>
        <div>
          <h5>Studios 25</h5>
          <ul>
            <li><Link to="/studio">Book a session</Link></li>
            <li><Link to="/studio">Packages</Link></li>
            <li><Link to="/studio">Add-ons</Link></li>
          </ul>
        </div>
        <div>
          <h5>Follow TCL</h5>
          <ul>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">TikTok</a></li>
            <li><a href="#">WhatsApp</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} TCL Babcock. All rights reserved.</span>
        <span>Connect · Learn · Inspire</span>
      </div>
    </footer>
  );
}