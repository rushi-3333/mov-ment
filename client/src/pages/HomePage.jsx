import { Link, useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";

/**
 * Single home page for all logged-in users (user, manager, admin, owner).
 * Shows important matters, interesting content, and quick links to their dashboard.
 */
function HomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "user";
  const userName = localStorage.getItem("userName") || "User";
  const profilePicture = localStorage.getItem("profilePicture") || null;

  if (!token) {
    navigate("/login", { replace: true });
    return null;
  }

  const dashboardPath = role === "manager" ? "/manager" : role === "admin" || role === "owner" ? "/admin" : "/user";
  const dashboardLabel = role === "owner" ? "Admin dashboard" : role === "admin" ? "Admin dashboard" : role === "manager" ? "Manager dashboard" : "My dashboard";

  return (
    <div className="home-page">
      <header className="home-header">
        <Link to="/home" className="home-logo">
          Mov<span className="home-logo-accent">-</span>Ment
        </Link>
        <nav className="home-nav">
          <Link to={dashboardPath} className="home-btn home-btn-primary">{dashboardLabel}</Link>
          <button
            type="button"
            className="home-btn home-btn-ghost"
            onClick={() => { localStorage.clear(); navigate("/login", { replace: true }); }}
          >
            Sign out
          </button>
          <Avatar src={profilePicture} name={userName} size={36} />
        </nav>
      </header>

      <main className="home-main">
        <section className="home-welcome">
          <h1 className="home-welcome-title">
            Welcome back, <span className="home-welcome-name">{userName}</span>
          </h1>
          <p className="home-welcome-sub">
            {role === "user" && "Book events, track your bookings, and manage everything in one place."}
            {role === "manager" && "Manage your assigned events, chat with customers, and update event status."}
            {(role === "admin" || role === "owner") && "Oversee users, events, reports, and platform settings."}
          </p>
        </section>

        <section className="home-section">
          <h2 className="home-section-title">Important</h2>
          <div className="home-cards">
            <div className="home-card home-card-important">
              <h3>Your dashboard</h3>
              <p>Go to your full dashboard to see all events, bookings, and actions.</p>
              <Link to={dashboardPath} className="btn btn-primary">Open {dashboardLabel}</Link>
            </div>
            {role === "user" && (
              <div className="home-card">
                <h3>Book an event</h3>
                <p>Birthdays, surprises, corporate events, and more. Choose a package and pick a date.</p>
                <Link to="/user" className="btn btn-secondary">Book event</Link>
              </div>
            )}
            {(role === "manager" || role === "admin" || role === "owner") && (
              <div className="home-card">
                <h3>Pending events</h3>
                <p>Events waiting for assignment or acceptance. Review and accept from your dashboard.</p>
                <Link to={dashboardPath} className="btn btn-secondary">View pending</Link>
              </div>
            )}
            <div className="home-card">
              <h3>Support</h3>
              <p>Questions or issues? Raise a ticket from your dashboard and we'll get back to you.</p>
              <Link to={dashboardPath} className="btn btn-secondary">Support</Link>
            </div>
          </div>
        </section>

        <section className="home-section">
          <h2 className="home-section-title">Interesting</h2>
          <div className="home-cards home-cards-grid">
            <div className="home-card home-card-feature">
              <span className="home-card-icon">📅</span>
              <h3>Event types</h3>
              <p>Birthday, surprise, anniversary, farewell, product launch, corporate events, and more. Every event is customizable.</p>
            </div>
            <div className="home-card home-card-feature">
              <span className="home-card-icon">👥</span>
              <h3>Managers & chat</h3>
              <p>Dedicated managers for your events. Chat in-app, get updates, and request changes without leaving the platform.</p>
            </div>
            <div className="home-card home-card-feature">
              <span className="home-card-icon">🎉</span>
              <h3>Packages & add-ons</h3>
              <p>Decoration, food, photography, music/DJ, catering, venue setup. Pick what you need and get a clear quote.</p>
            </div>
            <div className="home-card home-card-feature">
              <span className="home-card-icon">📋</span>
              <h3>Invoices & history</h3>
              <p>Download invoices and view booking history from your dashboard. Reschedule or cancel when allowed by policy.</p>
            </div>
          </div>
        </section>

        <section className="home-section home-cta">
          <p className="home-cta-text">Need to do something specific?</p>
          <div className="home-cta-buttons">
            <Link to={dashboardPath} className="btn btn-primary btn-lg">{dashboardLabel}</Link>
            <Link to="/" className="btn btn-secondary btn-lg">Landing page</Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>Mov-Ment · Event booking & management</p>
        <div className="home-footer-links">
          <Link to="/home">Home</Link>
          <Link to={dashboardPath}>Dashboard</Link>
          <button type="button" className="home-footer-link-btn" onClick={() => { localStorage.clear(); window.location.href = "/"; }}>Sign out</button>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
