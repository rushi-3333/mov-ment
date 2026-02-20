import { useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../components/Modal";

const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:5000";

async function parseJsonResponse(res) {
  const text = await res.text();
  const t = text.trim();
  if (t.startsWith("<") || t.toLowerCase().startsWith("<!doctype")) throw new Error("Server returned a page instead of data. Is the backend running?");
  try {
    return t ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error("Invalid response from server.");
  }
}

function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    phone: "",
    city: "",
    area: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("error");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    setModalOpen(false);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }
      setSuccess(true);
      setModalType("success");
      setModalOpen(true);
      setForm({ name: "", email: "", password: "", role: "user", phone: "", city: "", area: "" });
    } catch (err) {
      const message = err.message || "Connection error. Is the server running on port 5000?";
      setError(message);
      setModalType("error");
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
          <h2 className="card-title">Create an account</h2>
          <p className="card-subtitle">Register as a user or manager to get started.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reg-name">Name</label>
              <input
                id="reg-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-phone">Phone (optional)</label>
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-role">I want to</label>
              <select id="reg-role" name="role" value={form.role} onChange={handleChange}>
                <option value="user">Book events (User)</option>
                <option value="manager">Handle events (Manager)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reg-city">City (optional)</label>
              <input
                id="reg-city"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Chennai"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-area">Area (optional)</label>
              <input
                id="reg-area"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="e.g. Anna Nagar"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating account…" : "Register"}
            </button>
          </form>
          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "success" ? "Account created" : "Registration failed"}
        type={modalType}
      >
        {modalType === "success"
          ? "You can now sign in with your email and password."
          : error}
      </Modal>
    </div>
  );
}

export default RegisterPage;
