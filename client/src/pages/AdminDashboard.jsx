import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import ProfileDropdown from "../components/ProfileDropdown";

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

function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pendingManagers, setPendingManagers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [events, setEvents] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedAdminConv, setSelectedAdminConv] = useState(null);
  const [adminConvMessages, setAdminConvMessages] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [ticketReply, setTicketReply] = useState("");
  const [refunds, setRefunds] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState(null);
  const [managerPerf, setManagerPerf] = useState([]);
  const [loadBalancing, setLoadBalancing] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [notifForm, setNotifForm] = useState({ title: "", body: "", broadcast: false, type: "general" });
  const [promoForm, setPromoForm] = useState({ code: "", type: "percent", value: 10, validFrom: "", validTo: "", maxUses: "" });
  const [assignTeamEvent, setAssignTeamEvent] = useState(null);
  const [assignTeamValue, setAssignTeamValue] = useState("");
  const [newRefund, setNewRefund] = useState({ eventId: "", amount: "", reason: "" });
  const [managerRequests, setManagerRequests] = useState([]);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [showRelogin, setShowRelogin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("users");
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", city: "", area: "", addressLine: "", profilePicture: "" });

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userName = profile?.name || localStorage.getItem("userName") || "Admin";

  const checkAuth = (res) => {
    if (res.status === 401) {
      localStorage.clear();
      navigate("/login", { replace: true });
      return true;
    }
    return false;
  };

  const fetchAll = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const uRes = await fetch(`${API_BASE}/api/admin/users`, { headers });
      if (checkAuth(uRes)) return;
      if (uRes.status === 403) {
        setError("Access denied. Please sign out and sign in with the owner account (admin@gmail.com) or an admin account.");
        setModalOpen(true);
        setShowRelogin(true);
        return;
      }
      const uData = await parseJsonResponse(uRes);
      if (!uRes.ok) throw new Error(uData.message || "Failed users");

      const [pRes, mRes, eRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/pending-managers`, { headers }),
        fetch(`${API_BASE}/api/admin/managers`, { headers }),
        fetch(`${API_BASE}/api/admin/events`, { headers }),
      ]);
      if (checkAuth(pRes) || checkAuth(mRes) || checkAuth(eRes)) return;
      const pData = await parseJsonResponse(pRes);
      const mData = await parseJsonResponse(mRes);
      const eData = await parseJsonResponse(eRes);
      if (!pRes.ok) throw new Error(pData.message || "Failed pending managers");
      if (!mRes.ok) throw new Error(mData.message || "Failed managers");
      if (!eRes.ok) throw new Error(eData.message || "Failed events");
      setUsers(uData);
      setPendingManagers(pData);
      setManagers(mData);
      setEvents(eData);
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const loadConversations = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/admin/conversations`, { headers });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load conversations");
      setModalOpen(true);
    }
  };

  const loadAdminConvMessages = async (convId) => {
    if (!convId) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/admin/conversations/${convId}/messages`, { headers });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setAdminConvMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load messages");
      setModalOpen(true);
    }
  };

  useEffect(() => {
    const allowed = role === "admin" || role === "owner";
    if (!token || !allowed) {
      navigate("/login", { replace: true });
      return;
    }
    fetchAll();
    loadProfile();
  }, []);

  const loadSupportTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-tickets`, { headers: { Authorization: `Bearer ${token}` } });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setSupportTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load tickets");
      setModalOpen(true);
    }
  };
  const loadRefunds = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/refunds`, { headers: { Authorization: `Bearer ${token}` } });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setRefunds(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load refunds");
      setModalOpen(true);
    }
  };
  const loadUserActivity = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/user-activity?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setUserActivity(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load activity");
      setModalOpen(true);
    }
  };
  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/analytics/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setAnalytics(data);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
      setModalOpen(true);
    }
  };
  const loadReports = async (period) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/analytics/reports?period=${period || "month"}`, { headers: { Authorization: `Bearer ${token}` } });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setReports(data);
    } catch (err) {
      setError(err.message || "Failed to load reports");
      setModalOpen(true);
    }
  };
  const loadManagerPerf = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/analytics/manager-performance`, { headers: { Authorization: `Bearer ${token}` } });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setManagerPerf(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load performance");
      setModalOpen(true);
    }
  };
  const loadLoadBalancing = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/analytics/load`, { headers: { Authorization: `Bearer ${token}` } });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setLoadBalancing(data);
    } catch (err) {
      setError(err.message || "Failed to load load balance");
      setModalOpen(true);
    }
  };
  const loadPromotions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/promotions`, { headers: { Authorization: `Bearer ${token}` } });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setPromotions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load promotions");
      setModalOpen(true);
    }
  };

  useEffect(() => {
    if (activeSection === "conversations") loadConversations();
    if (activeSection === "complaints") loadSupportTickets();
    if (activeSection === "refunds") loadRefunds();
    if (activeSection === "activity") loadUserActivity();
    if (activeSection === "analytics") { loadAnalytics(); loadManagerPerf(); loadLoadBalancing(); }
    if (activeSection === "reports") loadReports("month");
    if (activeSection === "notifications") {} // no list to load
    if (activeSection === "promotions") loadPromotions();
    if (activeSection === "manager-requests") loadManagerRequests();
    if (activeSection === "profile") loadProfile();
  }, [activeSection]);

  useEffect(() => {
    if (selectedAdminConv?._id) loadAdminConvMessages(selectedAdminConv._id);
    else setAdminConvMessages([]);
  }, [selectedAdminConv?._id]);

  const goToLogin = () => {
    localStorage.clear();
    setModalOpen(false);
    setShowRelogin(false);
    navigate("/login", { replace: true });
  };

  const approveManager = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/managers/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to approve");
      await fetchAll();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const promoteToAdmin = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}/promote-admin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to promote");
      await fetchAll();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const removeManager = async (id) => {
    if (!window.confirm("Remove this user as manager? They will become a regular user.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/managers/${id}/remove`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to remove manager");
      await fetchAll();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const loadManagerRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/manager-requests`, { headers: { Authorization: `Bearer ${token}` } });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setManagerRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load manager requests");
      setModalOpen(true);
    }
  };

  const approveManagerRequest = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/manager-requests/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to approve");
      loadManagerRequests();
      fetchAll();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const rejectManagerRequest = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/manager-requests/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to reject");
      loadManagerRequests();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) {
        setProfile(data);
        setProfileForm({
          name: data.name || "",
          phone: data.phone || "",
          city: data.location?.city || "",
          area: data.location?.area || "",
          addressLine: data.location?.addressLine || "",
          profilePicture: data.profilePicture || "",
        });
      }
    } catch (_) {}
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: "PATCH",
        headers: { ...json(), Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          profilePicture: profileForm.profilePicture.trim(),
          location: { city: profileForm.city.trim(), area: profileForm.area.trim(), addressLine: profileForm.addressLine.trim() },
        }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to update");
      setProfile(data);
      localStorage.setItem("userName", data.name || "");
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const isOwner = role === "owner";
  const usersExcludingManagers = users.filter((u) => u.role !== "manager");

  const openSection = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const resolveTicket = async (id, status, reply) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-tickets/${id}`, {
        method: "PATCH",
        headers: { ...json(), Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, reply }),
      });
      if (checkAuth(res)) return;
      if (!res.ok) throw new Error((await parseJsonResponse(res)).message || "Failed");
      setTicketReply("");
      loadSupportTickets();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const processRefund = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/refunds/${id}`, {
        method: "PATCH",
        headers: { ...json(), Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (checkAuth(res)) return;
      if (!res.ok) throw new Error((await parseJsonResponse(res)).message || "Failed");
      loadRefunds();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const sendNotification = async () => {
    if (!notifForm.title.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/notifications/send`, {
        method: "POST",
        headers: { ...json(), Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: notifForm.title, body: notifForm.body, broadcast: notifForm.broadcast, type: notifForm.type }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed");
      setNotifForm({ title: "", body: "", broadcast: false, type: "general" });
      setError(`Sent to ${data.count || 0} user(s)`);
      setModalOpen(true);
      setTimeout(() => setModalOpen(false), 2000);
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const createPromotion = async () => {
    if (!promoForm.code || !promoForm.validFrom || !promoForm.validTo) {
      setError("Code, valid from and valid to required");
      setModalOpen(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/promotions`, {
        method: "POST",
        headers: { ...json(), Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: promoForm.code,
          type: promoForm.type,
          value: Number(promoForm.value) || 0,
          validFrom: promoForm.validFrom,
          validTo: promoForm.validTo,
          maxUses: promoForm.maxUses || undefined,
        }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed");
      setPromoForm({ code: "", type: "percent", value: 10, validFrom: "", validTo: "", maxUses: "" });
      loadPromotions();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const createRefundRequest = async () => {
    const ev = events.find((e) => e._id === newRefund.eventId);
    if (!ev?.bookedBy?._id || !newRefund.amount) {
      setError("Select an event and enter amount");
      setModalOpen(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/refunds`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify({
          eventId: newRefund.eventId,
          userId: ev.bookedBy._id,
          amount: Number(newRefund.amount),
          reason: newRefund.reason || "",
        }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed");
      setNewRefund({ eventId: "", amount: "", reason: "" });
      loadRefunds();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const saveAssignTeam = async () => {
    if (!assignTeamEvent) return;
    const team = assignTeamValue.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${assignTeamEvent._id}/assign-team`, {
        method: "POST",
        headers: { ...json(), Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team }),
      });
      if (checkAuth(res)) return;
      if (!res.ok) throw new Error((await parseJsonResponse(res)).message || "Failed");
      setAssignTeamEvent(null);
      setAssignTeamValue("");
      fetchAll();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const json = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

  return (
    <div className="dashboard admin-dashboard">
      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}>
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className="admin-sidebar-hamburger" />
          <span className="admin-sidebar-hamburger" />
          <span className="admin-sidebar-hamburger" />
        </button>
        <nav className="admin-sidebar-nav">
          <button type="button" className={`admin-nav-item ${activeSection === "users" ? "active" : ""}`} onClick={() => openSection("users")}>
            All users
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "manager-requests" ? "active" : ""}`} onClick={() => openSection("manager-requests")}>
            Manager requests
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "pending" ? "active" : ""}`} onClick={() => openSection("pending")}>
            Pending approvals
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "managers" ? "active" : ""}`} onClick={() => openSection("managers")}>
            Managers
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "events" ? "active" : ""}`} onClick={() => openSection("events")}>
            Events & teams
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "conversations" ? "active" : ""}`} onClick={() => openSection("conversations")}>
            Manager–Customer chat
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "complaints" ? "active" : ""}`} onClick={() => openSection("complaints")}>
            Complaints
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "refunds" ? "active" : ""}`} onClick={() => openSection("refunds")}>
            Refunds
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "activity" ? "active" : ""}`} onClick={() => openSection("activity")}>
            User activity
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "analytics" ? "active" : ""}`} onClick={() => openSection("analytics")}>
            Reports & analytics
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "notifications" ? "active" : ""}`} onClick={() => openSection("notifications")}>
            Notifications
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "promotions" ? "active" : ""}`} onClick={() => openSection("promotions")}>
            Promotions
          </button>
          <button type="button" className={`admin-nav-item ${activeSection === "profile" ? "active" : ""}`} onClick={() => openSection("profile")}>
            Profile
          </button>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              Mov<span style={{ color: "var(--primary)" }}>-</span>Ment · {isOwner ? "Owner" : "Admin"}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Logged in as <strong>{userName}</strong>
            </p>
          </div>
          <ProfileDropdown
            userName={userName}
            profilePictureUrl={profile?.profilePicture || undefined}
            onProfile={() => openSection("profile")}
            onSettings={() => openSection("profile")}
            onRefresh={fetchAll}
            onLogout={logout}
          />
        </header>

        {activeSection === "users" && (
          <section className="section">
            <h2 className="section-title">All users</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>Users and admins only (managers are listed under Managers). Users can request to become a manager from their dashboard; review under Manager requests.</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>City</th>
                  </tr>
                </thead>
                <tbody>
                  {usersExcludingManagers.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.location?.city || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === "manager-requests" && (
          <section className="section">
            <h2 className="section-title">Manager requests</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>Users who requested to become a manager. Approve to grant manager role or reject the request.</p>
            {managerRequests.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No pending manager requests.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Requested</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerRequests.map((r) => (
                      <tr key={r._id}>
                        <td>{r.user?.name ?? "—"}</td>
                        <td>{r.user?.email ?? "—"}</td>
                        <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                        <td>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => approveManagerRequest(r._id)}>Approve</button>
                          <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={() => rejectManagerRequest(r._id)}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeSection === "pending" && (
          <section className="section">
            <h2 className="section-title">Pending manager approvals</h2>
            {pendingManagers.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No pending approvals.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>City</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingManagers.map((m) => (
                      <tr key={m._id}>
                        <td>{m.name}</td>
                        <td>{m.email}</td>
                        <td>{m.location?.city || "—"}</td>
                        <td>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => approveManager(m._id)}>
                            Approve
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={() => removeManager(m._id)}>
                            Remove manager
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeSection === "managers" && (
          <section className="section">
            <h2 className="section-title">Managers</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Approved</th>
                    <th>City</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map((m) => (
                    <tr key={m._id}>
                      <td>{m.name}</td>
                      <td>{m.email}</td>
                      <td>{m.approved ? "Yes" : "No"}</td>
                      <td>{m.location?.city || "—"}</td>
                      <td>
                        {m.approved && (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => promoteToAdmin(m._id)}>
                            Make admin
                          </button>
                        )}
                        <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: m.approved ? 8 : 0 }} onClick={() => removeManager(m._id)}>
                          Remove manager
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === "events" && (
          <section className="section">
            <h2 className="section-title">Events & team assignment</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>Track all events. Assign team members (comma-separated names) for efficient delivery.</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>City</th>
                    <th>Booked by</th>
                    <th>Manager</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev._id}>
                      <td>{ev.title}</td>
                      <td>{ev.type}</td>
                      <td>{ev.status}</td>
                      <td>{ev.location?.city || "—"}</td>
                      <td>{ev.bookedBy?.name || "—"}</td>
                      <td>{ev.assignedManager?.name || "—"}</td>
                      <td>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAssignTeamEvent(ev); setAssignTeamValue(""); }}>Assign team</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {assignTeamEvent && (
              <div style={{ marginTop: 16, padding: 16, background: "var(--bg-input)", borderRadius: 8 }}>
                <h4>Assign team: {assignTeamEvent.title}</h4>
                <input placeholder="Team names (comma-separated)" value={assignTeamValue} onChange={(e) => setAssignTeamValue(e.target.value)} style={{ width: "100%", maxWidth: 400, marginRight: 8, marginTop: 8 }} />
                <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={saveAssignTeam}>Save</button>
                <button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: 8, marginTop: 8 }} onClick={() => setAssignTeamEvent(null)}>Cancel</button>
              </div>
            )}
          </section>
        )}

        {activeSection === "conversations" && (
          <section className="section">
            <h2 className="section-title">Manager–Customer chat</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>View all conversations between customers and managers. Admin oversight only (read-only).</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ minWidth: 260, flex: "1 1 260px" }}>
                <h3 style={{ fontSize: "1rem" }}>All conversations</h3>
                {conversations.length === 0 ? (
                  <p style={{ color: "var(--text-muted)" }}>No conversations yet.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {conversations.map((c) => (
                      <li key={c._id}>
                        <button
                          type="button"
                          className={`btn btn-sm ${selectedAdminConv?._id === c._id ? "btn-primary" : "btn-secondary"}`}
                          style={{ width: "100%", textAlign: "left", marginBottom: 6 }}
                          onClick={() => setSelectedAdminConv(c)}
                        >
                          {c.event?.title ?? "Event"} — {c.user?.name ?? "Customer"} / {c.manager?.name ?? "Manager"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ flex: "2 1 320px" }}>
                {selectedAdminConv ? (
                  <>
                    <h3 style={{ fontSize: "1rem" }}>Messages (read-only)</h3>
                    <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--bg-input)" }}>
                      {adminConvMessages.length === 0 && <p style={{ color: "var(--text-muted)" }}>No messages.</p>}
                      {adminConvMessages.map((m, i) => (
                        <div key={i} style={{ marginBottom: 8, textAlign: m.from === "user" ? "right" : "left" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.from === "user" ? (selectedAdminConv.user?.name ?? "Customer") : (selectedAdminConv.manager?.name ?? "Manager")}</span>
                          <div style={{ padding: "6px 10px", borderRadius: 8, display: "inline-block", background: m.from === "user" ? "var(--primary)" : "var(--border)", color: m.from === "user" ? "#fff" : "var(--text)" }}>{m.text}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>Select a conversation to view messages.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeSection === "complaints" && (
          <section className="section">
            <h2 className="section-title">Complaints & support tickets</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Handle user complaints and support tickets. Update status and add replies.</p>
            {supportTickets.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No tickets.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>User</th><th>Subject</th><th>Category</th><th>Status</th><th>Event</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {supportTickets.map((t) => (
                      <tr key={t._id}>
                        <td>{t.user?.name} ({t.user?.email})</td>
                        <td>{t.subject}</td>
                        <td>{t.category}</td>
                        <td>{t.status}</td>
                        <td>{t.relatedEvent?.title || "—"}</td>
                        <td>
                          <input placeholder="Reply..." value={ticketReply} onChange={(e) => setTicketReply(e.target.value)} style={{ width: 120, marginRight: 4 }} />
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => resolveTicket(t._id, "in_progress", ticketReply)}>Reply</button>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => resolveTicket(t._id, "resolved", ticketReply)}>Resolve</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeSection === "refunds" && (
          <section className="section">
            <h2 className="section-title">Refunds</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Create refund requests or approve/reject pending ones.</p>
            <div style={{ marginBottom: 24, padding: 16, background: "var(--bg-input)", borderRadius: 8, maxWidth: 480 }}>
              <h4>Create refund</h4>
              <select value={newRefund.eventId} onChange={(e) => setNewRefund((f) => ({ ...f, eventId: e.target.value }))} style={{ marginRight: 8, marginTop: 8 }}>
                <option value="">Select event</option>
                {events.filter((e) => e.bookedBy?._id).map((e) => (
                  <option key={e._id} value={e._id}>{e.title} — {e.bookedBy?.name}</option>
                ))}
              </select>
              <input type="number" placeholder="Amount" value={newRefund.amount} onChange={(e) => setNewRefund((f) => ({ ...f, amount: e.target.value }))} style={{ width: 100, marginRight: 8, marginTop: 8 }} />
              <input placeholder="Reason (optional)" value={newRefund.reason} onChange={(e) => setNewRefund((f) => ({ ...f, reason: e.target.value }))} style={{ width: 160, marginTop: 8 }} />
              <button type="button" className="btn btn-primary btn-sm" style={{ marginLeft: 8, marginTop: 8 }} onClick={createRefundRequest}>Create refund</button>
            </div>
            {refunds.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No refunds.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>User</th><th>Event</th><th>Amount</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {refunds.map((r) => (
                      <tr key={r._id}>
                        <td>{r.user?.name}</td>
                        <td>{r.event?.title}</td>
                        <td>{r.amount}</td>
                        <td>{r.status}</td>
                        <td>
                          {r.status === "pending" && (
                            <>
                              <button type="button" className="btn btn-primary btn-sm" onClick={() => processRefund(r._id, "processed")}>Approve</button>
                              <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={() => processRefund(r._id, "rejected")}>Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeSection === "activity" && (
          <section className="section">
            <h2 className="section-title">User activity</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Track user actions for insights (logins, bookings, cancellations, etc.).</p>
            {userActivity.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No activity recorded yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>User</th><th>Action</th><th>Entity</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {userActivity.slice(0, 100).map((a) => (
                      <tr key={a._id}>
                        <td>{a.user?.name ?? a.user}</td>
                        <td>{a.action}</td>
                        <td>{a.entityType || "—"}</td>
                        <td>{new Date(a.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeSection === "analytics" && (
          <section className="section">
            <h2 className="section-title">Reports & analytics</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Revenue, bookings, customer feedback. Manager performance and load balancing.</p>
            {analytics && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                <div style={{ padding: 16, background: "var(--bg-input)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Revenue (this month)</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>₹{analytics.revenue ?? 0}</div>
                </div>
                <div style={{ padding: 16, background: "var(--bg-input)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Bookings</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{analytics.bookingsCount ?? 0}</div>
                </div>
                <div style={{ padding: 16, background: "var(--bg-input)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Avg rating</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{analytics.avgRating ?? 0} ★</div>
                </div>
                <div style={{ padding: 16, background: "var(--bg-input)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Cancelled</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{analytics.cancelledCount ?? 0}</div>
                </div>
              </div>
            )}
            {analytics?.byType && Object.keys(analytics.byType).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 8 }}>Bookings by event type</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(analytics.byType).map(([type, count]) => (
                    <div key={type} style={{ padding: "8px 12px", background: "var(--primary)", color: "#fff", borderRadius: 8, minWidth: 100 }}>
                      {type.replace(/_/g, " ")}: <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analytics?.highDemandDates && analytics.highDemandDates.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 8 }}>High-demand dates (predictive)</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analytics.highDemandDates.map((d) => (
                    <span key={d._id} style={{ padding: "4px 8px", background: "var(--bg-input)", borderRadius: 6, fontSize: "0.9rem" }}>{d._id}: {d.count}</span>
                  ))}
                </div>
              </div>
            )}
            {managerPerf.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 8 }}>Manager performance</h4>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Manager</th><th>Events</th><th>Completed</th><th>Completion %</th><th>Avg rating</th></tr></thead>
                    <tbody>
                      {managerPerf.map((m) => (
                        <tr key={m._id}>
                          <td>{m.name} ({m.email})</td>
                          <td>{m.totalEvents}</td>
                          <td>{m.completedEvents}</td>
                          <td>{m.completionRate}%</td>
                          <td>{m.avgRating || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {loadBalancing && (
              <div>
                <h4 style={{ marginBottom: 8 }}>Load balancing (upcoming events)</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Pending unassigned: <strong>{loadBalancing.pendingCount ?? 0}</strong> · Total upcoming: <strong>{loadBalancing.totalUpcoming ?? 0}</strong></p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {(loadBalancing.byManager || []).map((m, i) => (
                    <div key={i} style={{ padding: 12, background: "var(--bg-input)", borderRadius: 8, minWidth: 160 }}>
                      <strong>{m.manager?.name ?? "Unassigned"}</strong>: {m.count} event(s)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeSection === "notifications" && (
          <section className="section">
            <h2 className="section-title">Notifications & alerts</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Send updates to users and managers. Use for reminders or emergency alerts.</p>
            <div style={{ maxWidth: 480 }}>
              <div className="form-group">
                <label>Title</label>
                <input value={notifForm.title} onChange={(e) => setNotifForm((f) => ({ ...f, title: e.target.value }))} placeholder="Notification title" />
              </div>
              <div className="form-group">
                <label>Body (optional)</label>
                <textarea value={notifForm.body} onChange={(e) => setNotifForm((f) => ({ ...f, body: e.target.value }))} placeholder="Message" rows={3} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={notifForm.type} onChange={(e) => setNotifForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="general">General</option>
                  <option value="reminder">Reminder</option>
                  <option value="update">Update</option>
                  <option value="emergency_alert">Emergency alert</option>
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <input type="checkbox" checked={notifForm.broadcast} onChange={(e) => setNotifForm((f) => ({ ...f, broadcast: e.target.checked }))} />
                Send to all users (broadcast)
              </label>
              <button type="button" className="btn btn-primary" onClick={sendNotification}>Send notification</button>
            </div>
          </section>
        )}

        {activeSection === "promotions" && (
          <section className="section">
            <h2 className="section-title">Promotions & discount codes</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Create and manage discount codes. Seasonal or event-specific offers.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
              <div style={{ minWidth: 280 }}>
                <h4>Create new</h4>
                <div className="form-group">
                  <label>Code</label>
                  <input value={promoForm.code} onChange={(e) => setPromoForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" />
                </div>
                <div className="form-group">
                  <label>Type / Value</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select value={promoForm.type} onChange={(e) => setPromoForm((f) => ({ ...f, type: e.target.value }))}>
                      <option value="percent">Percent</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                    <input type="number" value={promoForm.value} onChange={(e) => setPromoForm((f) => ({ ...f, value: e.target.value }))} placeholder="10" style={{ width: 80 }} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Valid from / to</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="datetime-local" value={promoForm.validFrom} onChange={(e) => setPromoForm((f) => ({ ...f, validFrom: e.target.value }))} />
                    <input type="datetime-local" value={promoForm.validTo} onChange={(e) => setPromoForm((f) => ({ ...f, validTo: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Max uses (optional)</label>
                  <input type="number" value={promoForm.maxUses} onChange={(e) => setPromoForm((f) => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" />
                </div>
                <button type="button" className="btn btn-primary" onClick={createPromotion}>Create promotion</button>
              </div>
              <div style={{ flex: 1 }}>
                <h4>Active promotions</h4>
                {promotions.length === 0 ? <p style={{ color: "var(--text-muted)" }}>None.</p> : (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {promotions.map((p) => (
                      <li key={p._id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                        <strong>{p.code}</strong> — {p.type === "percent" ? `${p.value}%` : `₹${p.value}`} · {new Date(p.validFrom).toLocaleDateString()} – {new Date(p.validTo).toLocaleDateString()} · Used: {p.usedCount}{p.maxUses ? `/${p.maxUses}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        {activeSection === "profile" && (
          <section className="section">
            <h2 className="section-title">Profile</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Update your admin details.</p>
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label>Profile picture (URL)</label>
                <input type="url" placeholder="https://..." value={profileForm.profilePicture} onChange={(e) => setProfileForm((f) => ({ ...f, profilePicture: e.target.value }))} />
                {profileForm.profilePicture && (
                  <div style={{ marginTop: 8 }}>
                    <img src={profileForm.profilePicture} alt="Preview" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Name</label>
                <input value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Optional" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label>City</label>
                  <input value={profileForm.city} onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label>Area</label>
                  <input value={profileForm.area} onChange={(e) => setProfileForm((f) => ({ ...f, area: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
              <div className="form-group">
                <label>Address line</label>
                <input value={profileForm.addressLine} onChange={(e) => setProfileForm((f) => ({ ...f, addressLine: e.target.value }))} placeholder="Optional" />
              </div>
              <button type="submit" className="btn btn-primary">Save profile</button>
            </form>
          </section>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setShowRelogin(false); }}
        title={showRelogin ? "Access denied" : "Error"}
        type="error"
      >
        <p>{error}</p>
        {showRelogin && (
          <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={goToLogin}>
            Sign out and go to Login
          </button>
        )}
      </Modal>
    </div>
  );
}

export default AdminDashboard;
