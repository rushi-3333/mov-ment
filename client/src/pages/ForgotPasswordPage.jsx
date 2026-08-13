import { Link } from "react-router-dom";

function ForgotPasswordPage() {
  return (
    <div className="app-page">
      <div className="container">
        <h1 className="brand">Mov<span>-</span>Ment</h1>
        <div className="card">
          <h2 className="card-title">Forgot password?</h2>
          <p style={{ marginBottom: 12 }}>
            Contact your administrator. They can set a new password for you from the <strong>Admin dashboard</strong>:
          </p>
          <ul style={{ textAlign: "left", marginBottom: 16, color: "var(--text-muted)" }}>
            <li>Go to <strong>All users</strong> or <strong>Managers</strong></li>
            <li>Find your account and click <strong>Set password</strong></li>
            <li>Enter a new password and share it with you securely</li>
          </ul>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            You can then sign in with your email and the new password.
          </p>
          <p className="auth-footer" style={{ marginTop: 16 }}>
            <Link to="/login">Back to Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
