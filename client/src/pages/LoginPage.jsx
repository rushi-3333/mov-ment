import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:5000";

async function parseJsonResponse(res) {
  const text = await res.text();
  const t = text.trim();
  if (t.startsWith("<") || t.toLowerCase().startsWith("<!doctype")) throw new Error("Server returned a page instead of data. Is the backend running on port 5000?");
  try {
    return t ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error("Invalid response from server.");
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactor, setTwoFactor] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const value = emailOrPhone.trim();
      const body = value.includes("@") ? { email: value, password } : { phone: value, password };
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Login failed");
      if (data.requireTwoFactor) {
        setTwoFactor({ tempUserId: data.tempUserId, message: data.message });
        setCode("");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user?.role || "user");
      localStorage.setItem("userName", data.user?.name || "");
      const role = data.user?.role || "user";
      if (role === "manager") navigate("/manager", { replace: true });
      else if (role === "admin" || role === "owner") navigate("/admin", { replace: true });
      else navigate("/user", { replace: true });
    } catch (err) {
      setError(err.message || "Connection error. Is the server running on port 5000?");
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempUserId: twoFactor.tempUserId, code: code.replace(/\s/g, "") }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Invalid code");
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user?.role || "user");
      localStorage.setItem("userName", data.user?.name || "");
      const role = data.user?.role || "user";
      if (role === "manager") navigate("/manager", { replace: true });
      else if (role === "admin" || role === "owner") navigate("/admin", { replace: true });
      else navigate("/user", { replace: true });
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <div className="container">
        <h1 className="brand">Mov<span>-</span>Ment</h1>
        <div className="card">
          <h2 className="card-title">Sign in</h2>
          <p className="card-subtitle">
            {twoFactor ? "Enter the 6-digit code from your authenticator app" : "Sign in with email or phone."}
          </p>
          {!twoFactor ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Email or phone</label>
                <input
                  id="login-email"
                  type="text"
                  inputMode="email"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="you@example.com or 9876543210"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && !modalOpen && <p className="msg-error">{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA}>
              <div className="form-group">
                <label>Verification code</label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading || code.length !== 6}>
                Verify
              </button>
              <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => setTwoFactor(null)}>
                Back
              </button>
            </form>
          )}
          <p className="auth-footer">
            Don’t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Sign in failed" type="error">
        {error}
      </Modal>
    </div>
  );
}

export default LoginPage;
