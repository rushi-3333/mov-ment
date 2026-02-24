import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-left">
          <Link to="/" className="landing-logo">
            Mov<span className="landing-logo-accent">-</span>Ment
          </Link>
        </div>
        <nav className="landing-header-right">
          <Link to="/login" className="landing-link">
            Sign in
          </Link>
          <Link to="/register" className="landing-btn-primary">
            Sign up
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-text">
            <h1>All your events in one simple place.</h1>
            <p>
              Mov-Ment helps you plan, book, and manage birthdays, corporate events, surprises, and more — with
              dedicated managers and clear tracking for every booking.
            </p>
            <div className="landing-hero-actions">
              <Link to="/login" className="landing-btn-primary">
                Get started
              </Link>
              <Link to="/register" className="landing-btn-ghost">
                Create an account
              </Link>
            </div>
          </div>
          <div className="landing-hero-panel">
            <div className="landing-hero-card">
              <h2>Why Mov-Ment?</h2>
              <ul>
                <li>Quick event booking with clear packages</li>
                <li>Managers and chat for every event</li>
                <li>Invoices, history, and reports in one dashboard</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-feature">
            <h3>For customers</h3>
            <p>Book and track events, manage payments, and chat with your manager in one place.</p>
          </div>
          <div className="landing-feature">
            <h3>For managers</h3>
            <p>See assigned events, update statuses, and coordinate details with customers.</p>
          </div>
          <div className="landing-feature">
            <h3>For admins</h3>
            <p>Monitor users, events, finances, and reports from a powerful dashboard.</p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>Mov-Ment · Event booking &amp; management</p>
      </footer>
    </div>
  );
}

export default LandingPage;

