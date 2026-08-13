import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-logo">
          Mov<span className="landing-logo-accent">-</span>Ment
        </Link>
        <nav className="landing-nav">
          <Link to="/login" className="landing-btn landing-btn-ghost">Sign in</Link>
          <Link to="/register" className="landing-btn landing-btn-primary">Sign up</Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <h1 className="landing-hero-title">
            Event planning, <span className="landing-hero-highlight">simplified</span>
          </h1>
          <p className="landing-hero-subtitle">
            Book birthdays, surprises, corporate events, and more. Connect with managers, track your events, and get everything done in one place.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="landing-btn landing-btn-primary landing-btn-lg">Get started</Link>
            <Link to="/login" className="landing-btn landing-btn-ghost landing-btn-lg">Sign in</Link>
          </div>
        </section>

        <section className="landing-features">
          <h2 className="landing-features-title">Why Mov-Ment</h2>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📅</div>
              <h3>Easy booking</h3>
              <p>Choose a package, pick a date, and book. Every event is customizable to your needs.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">👥</div>
              <h3>Managers & support</h3>
              <p>Dedicated managers for your events. Chat, get updates, and request changes in one place.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🎉</div>
              <h3>All event types</h3>
              <p>Birthdays, surprises, farewells, anniversaries, corporate events, and product launches.</p>
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <p className="landing-cta-text">Ready to plan your next event?</p>
          <Link to="/register" className="landing-btn landing-btn-primary landing-btn-lg">Create account</Link>
        </section>
      </main>

      <footer className="landing-footer">
        <p>Mov-Ment · Event booking & management</p>
        <div className="landing-footer-links">
          <Link to="/login">Sign in</Link>
          <Link to="/register">Sign up</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
