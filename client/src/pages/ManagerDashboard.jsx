import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import ProfileDropdown from "../components/ProfileDropdown";
import { apiUrl, parseJsonResponse } from "../utils/api";

function ManagerDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", type: "", city: "", status: "" });
  const [nearbyLat, setNearbyLat] = useState("");
  const [nearbyLng, setNearbyLng] = useState("");
  const [nearbyRadius, setNearbyRadius] = useState("20");
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [resources, setResources] = useState([]);
  const [resourceForm, setResourceForm] = useState({ name: "", type: "other", quantity: 1, unit: "pcs" });
  const [performance, setPerformance] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackReply, setFeedbackReply] = useState({});
  const [teamInput, setTeamInput] = useState("");
  const [teamModalEvent, setTeamModalEvent] = useState(null);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", city: "", area: "", addressLine: "", profilePicture: "" });
  const [performedEvents, setPerformedEvents] = useState([]);
  const [performedEventForm, setPerformedEventForm] = useState({ type: "birthday", title: "", description: "", imageUrl: "", venue: "", guestCount: "", performedAt: new Date().toISOString().slice(0, 10) });
  const [performedEventSaving, setPerformedEventSaving] = useState(false);

  const token = localStorage.getItem("token");
  const userName = profile?.name || localStorage.getItem("userName") || "Manager";
  const headers = () => ({ Authorization: `Bearer ${token}` });
  const json = () => ({ ...headers(), "Content-Type": "application/json" });

  const checkAuth = (res) => {
    if (res.status === 401) {
      localStorage.clear();
      navigate("/login", { replace: true });
      return true;
    }
    return false;
  };

  const loadAssigned = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.type) params.append("type", filters.type);
      if (filters.city) params.append("city", filters.city);
      if (filters.status) params.append("status", filters.status);
      const url = params.toString() ? apiUrl(`/api/manager/events?${params}`) : apiUrl('/api/manager/events');
      const res = await fetch(url, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setAssignedEvents(data);
    } catch (err) {
      setError(err.message || "Failed to load events");
      setModalOpen(true);
    }
  };

  const loadPending = async () => {
    try {
      const res = await fetch(apiUrl("/api/events/pending"), { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setPendingEvents(data);
    } catch (err) {
      setError(err.message || "Failed to load pending");
      setModalOpen(true);
    }
  };

  const loadNearby = async () => {
    try {
      const params = new URLSearchParams({ radiusKm: nearbyRadius });
      if (nearbyLat) params.append("lat", nearbyLat);
      if (nearbyLng) params.append("lng", nearbyLng);
      const res = await fetch(apiUrl(`/api/manager/events/nearby?${params}`), { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setNearbyEvents(data);
    } catch (err) {
      setError(err.message || "Failed to load nearby");
      setModalOpen(true);
    }
  };

  const loadCalendar = async () => {
    try {
      const res = await fetch(apiUrl(`/api/manager/events/calendar?year=${calendarYear}&month=${calendarMonth}`), { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setCalendarEvents(data);
    } catch (err) {
      setError(err.message || "Failed to load calendar");
      setModalOpen(true);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(apiUrl("/api/manager/notifications"), { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setNotifications(data);
    } catch {
      /* optional background fetch */
    }
  };

  const loadConversations = async () => {
    try {
      const res = await fetch(apiUrl("/api/manager/conversations"), { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setConversations(data);
    } catch (err) {
      setError(err.message || "Failed to load conversations");
      setModalOpen(true);
    }
  };

  const loadResources = async () => {
    try {
      const res = await fetch(apiUrl("/api/manager/resources"), { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setResources(data);
    } catch (err) {
      setError(err.message || "Failed to load resources");
      setModalOpen(true);
    }
  };

  const loadPerformance = async () => {
    try {
      const res = await fetch(apiUrl("/api/manager/performance"), { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setPerformance(data);
    } catch {
      /* optional background fetch */
    }
  };

  const loadFeedback = async () => {
    try {
      const res = await fetch(apiUrl("/api/manager/feedback"), { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setFeedbackList(data);
    } catch {
      /* optional background fetch */
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    loadAssigned();
    loadPending();
    loadProfile();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);

  useEffect(() => {
    if (section === "events" || section === "dashboard") loadAssigned();
    if (section === "calendar") loadCalendar();
    if (section === "nearby") loadNearby();
    if (section === "notifications") loadNotifications();
    if (section === "chat") loadConversations();
    if (section === "resources") loadResources();
    if (section === "performance") {
      loadPerformance();
      loadFeedback();
    }
    if (section === "profile") loadProfile();
    if (section === "performed") loadPerformedEvents();
  }, [section, filters.dateFrom, filters.dateTo, filters.type, filters.city, filters.status, calendarYear, calendarMonth]);

  useEffect(() => {
    if (!selectedConv) {
      setConvMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/manager/conversations/${selectedConv._id}/messages`), { headers: headers() });
        if (checkAuth(res)) return;
        const data = await parseJsonResponse(res);
        if (!cancelled) setConvMessages(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setConvMessages([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedConv]);

  const acceptEvent = async (id) => {
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/events/${id}/accept`), { method: "POST", headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to accept");
      setPendingEvents((p) => p.filter((e) => e._id !== id));
      setNearbyEvents((n) => n.filter((e) => e._id !== id));
      loadAssigned();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const updateStatus = async (id, status) => {
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/events/${id}/status`), {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ status }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to update status");
      loadAssigned();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const assignTeam = async (eventId, teamNames) => {
    setError("");
    try {
      const team = teamNames.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch(apiUrl(`/api/manager/events/${eventId}/team`), {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ team }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed");
      setTeamModalEvent(null);
      setTeamInput("");
      loadAssigned();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const setReminder = async (eventId) => {
    try {
      const res = await fetch(apiUrl(`/api/manager/events/${eventId}/remind`), { method: "POST", headers: headers() });
      if (checkAuth(res)) return;
      if (res.ok) loadAssigned();
    } catch (err) {
      setError(err.message || "Failed to set reminder");
      setModalOpen(true);
    }
  };

  const openOrCreateConversation = async (eventId) => {
    setError("");
    try {
      const res = await fetch(apiUrl("/api/manager/conversations"), {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ eventId }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) {
        setSelectedConv(data);
        setSection("chat");
        loadConversations();
      } else throw new Error(data.message || "Failed to start conversation");
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const replyToFeedback = async (feedbackId, reply) => {
    if (!reply?.trim()) return;
    try {
      const res = await fetch(apiUrl(`/api/manager/feedback/${feedbackId}/reply`), {
        method: "PATCH",
        headers: json(),
        body: JSON.stringify({ reply: reply.trim() }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) {
        setFeedbackList((list) => list.map((f) => (f._id === feedbackId ? { ...f, managerReply: data.managerReply, managerRepliedAt: data.managerRepliedAt } : f)));
        setFeedbackReply((r) => ({ ...r, [feedbackId]: "" }));
      } else throw new Error(data.message || "Failed");
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const sendMessage = async () => {
    if (!selectedConv || !newMessage.trim()) return;
    try {
      const res = await fetch(apiUrl(`/api/manager/conversations/${selectedConv._id}/messages`), {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ text: newMessage.trim() }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) {
        setConvMessages(data);
        setNewMessage("");
      } else throw new Error(data.message || "Failed to send");
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const addResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.name.trim()) return;
    setError("");
    try {
      const res = await fetch(apiUrl("/api/manager/resources"), {
        method: "POST",
        headers: json(),
        body: JSON.stringify(resourceForm),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) {
        setResources((r) => [...r, data]);
        setResourceForm({ name: "", type: "other", quantity: 1, unit: "pcs" });
      } else throw new Error(data.message || "Failed to add");
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const toggleResourceAvailable = async (id, available) => {
    try {
      const res = await fetch(apiUrl(`/api/manager/resources/${id}`), {
        method: "PATCH",
        headers: json(),
        body: JSON.stringify({ available }),
      });
      if (checkAuth(res)) return;
      if (res.ok) loadResources();
    } catch (err) {
      setError(err.message || "Failed to update");
      setModalOpen(true);
    }
  };

  const deleteResource = async (id) => {
    try {
      const res = await fetch(apiUrl(`/api/manager/resources/${id}`), { method: "DELETE", headers: headers() });
      if (checkAuth(res)) return;
      if (res.ok) setResources((r) => r.filter((x) => x._id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete");
      setModalOpen(true);
    }
  };

  const openSection = (s) => {
    setSection(s);
    setSidebarOpen(false);
  };

  const loadProfile = async () => {
    try {
      const res = await fetch(apiUrl("/api/user/profile"), { headers: headers() });
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
    } catch {
      /* optional background fetch */
    }
  };

  const loadPerformedEvents = async () => {
    try {
      const url = apiUrl("/api/manager/performed-events");
      const res = await fetch(url, { headers: headers() });
      if (checkAuth(res)) return;
      const text = await res.text();
      const trimmed = text.trim();
      if (trimmed.startsWith("<") || trimmed.toLowerCase().startsWith("<!doctype")) {
        const statusInfo = res.status ? ` (HTTP ${res.status})` : "";
        setError(
          `Backend returned a page instead of data${statusInfo}. ` +
          `Request was to: ${url}. ` +
          "Start the backend: run 'npm start' from the project root, or run 'node index.js' in the server folder. " +
          "Check that nothing else is using port 5000. Open the API health URL in your browser — you should see JSON; if you see HTML, the backend is not running."
        );
        setModalOpen(true);
        setPerformedEvents([]);
        return;
      }
      const data = trimmed ? JSON.parse(trimmed) : [];
      if (res.ok) setPerformedEvents(Array.isArray(data) ? data : []);
      else {
        setError(data.message || "Failed to load performed events");
        setModalOpen(true);
      }
    } catch (err) {
      setError(err.message || "Failed to load performed events");
      setModalOpen(true);
    }
  };

  const addPerformedEvent = async (e) => {
    e.preventDefault();
    if (!performedEventForm.title.trim()) return;
    setPerformedEventSaving(true);
    try {
      const res = await fetch(apiUrl("/api/manager/performed-events"), {
        method: "POST",
        headers: json(),
        body: JSON.stringify({
          type: performedEventForm.type,
          title: performedEventForm.title.trim(),
          description: performedEventForm.description.trim() || undefined,
          imageUrl: performedEventForm.imageUrl.trim() || undefined,
          venue: performedEventForm.venue.trim() || undefined,
          guestCount: performedEventForm.guestCount ? parseInt(performedEventForm.guestCount, 10) : undefined,
          performedAt: performedEventForm.performedAt || undefined,
        }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to add");
      setPerformedEventForm({ type: "birthday", title: "", description: "", imageUrl: "", venue: "", guestCount: "", performedAt: new Date().toISOString().slice(0, 10) });
      loadPerformedEvents();
    } catch (err) {
      setError(err.message || "Failed to add performed event");
      setModalOpen(true);
    } finally {
      setPerformedEventSaving(false);
    }
  };

  const deletePerformedEvent = async (id) => {
    if (!window.confirm("Remove this event from your portfolio? It will no longer appear in that category for users.")) return;
    try {
      const res = await fetch(
        apiUrl(`/api/manager/performed-events/${id}`),
        { method: "DELETE", headers: headers() }
      );
      if (checkAuth(res)) return;
      if (res.ok) loadPerformedEvents();
      else {
        const data = await parseJsonResponse(res);
        setError(data.message || "Failed to delete");
        setModalOpen(true);
      }
    } catch (err) {
      setError(err.message || "Failed to delete");
      setModalOpen(true);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(apiUrl("/api/user/profile"), {
        method: "PATCH",
        headers: json(),
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

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const upcoming = assignedEvents.filter((e) => e.status !== "completed" && e.status !== "cancelled" && new Date(e.scheduledAt) >= new Date()).slice(0, 5);

  return (
    <div className="dashboard admin-dashboard">
      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}>
        <button type="button" className="admin-sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Menu">
          <span className="admin-sidebar-hamburger" />
          <span className="admin-sidebar-hamburger" />
          <span className="admin-sidebar-hamburger" />
        </button>
        <nav className="admin-sidebar-nav">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "events", label: "My events" },
            { id: "performed", label: "My performed events" },
            { id: "calendar", label: "Calendar" },
            { id: "pending", label: "Pending" },
            { id: "nearby", label: "Nearby events" },
            { id: "chat", label: "Customer chat" },
            { id: "resources", label: "Resources" },
            { id: "performance", label: "Performance" },
            { id: "notifications", label: "Notifications" },
            { id: "profile", label: "Profile" },
          ].map(({ id, label }) => (
            <button key={id} type="button" className={`admin-nav-item ${section === id ? "active" : ""}`} onClick={() => openSection(id)}>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              <Link to="/" className="dashboard-brand">Mov<span style={{ color: "var(--primary)" }}>-</span>Ment</Link>
              {" · Manager"}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>Logged in as <strong>{userName}</strong></p>
          </div>
          <ProfileDropdown
            userName={userName}
            profilePictureUrl={profile?.profilePicture || undefined}
            onProfile={() => openSection("profile")}
            onSettings={() => openSection("profile")}
            onRefresh={() => { loadAssigned(); loadPending(); }}
            onLogout={logout}
          />
        </header>

        {section === "dashboard" && (
          <>
            <section className="section">
              <h2 className="section-title">Event dashboard</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Your assigned events and quick actions.</p>
              {upcoming.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No upcoming events. Check Pending or Nearby to accept more.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {upcoming.map((ev) => (
                    <li key={ev._id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <span><strong>{ev.title}</strong> — {new Date(ev.scheduledAt).toLocaleString()} · {ev.status}</span>
                      <span>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTeamModalEvent(ev)}>Assign team</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReminder(ev._id)}>Remind</button>
                        {ev.status === "accepted" && <button type="button" className="btn btn-primary btn-sm" onClick={() => updateStatus(ev._id, "in_progress")}>Start</button>}
                        {ev.status === "in_progress" && <button type="button" className="btn btn-primary btn-sm" onClick={() => updateStatus(ev._id, "completed")}>Complete</button>}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openOrCreateConversation(ev._id)}>Chat</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {section === "events" && (
          <section className="section">
            <h2 className="section-title">My events</h2>
            <div className="filters-row" style={{ marginBottom: 16 }}>
              <input placeholder="Date from" type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
              <input placeholder="Date to" type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
              <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                <option value="">All types</option>
                <option value="birthday">Birthday</option>
                <option value="surprise">Surprise</option>
                <option value="anniversary">Anniversary</option>
                <option value="farewell">Farewell</option>
                <option value="software_launch">Software launch</option>
                <option value="corporate">Corporate</option>
                <option value="other">Other</option>
              </select>
              <input placeholder="City" value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} />
              <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                <option value="">All statuses</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadAssigned}>Apply</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Scheduled</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Team</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedEvents.length === 0 && (
                    <tr><td colSpan={7} style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>No events.</td></tr>
                  )}
                  {assignedEvents.map((ev) => (
                    <tr key={ev._id}>
                      <td>{ev.title}</td>
                      <td>{ev.type}</td>
                      <td>{new Date(ev.scheduledAt).toLocaleString()}</td>
                      <td>
                        {ev.location?.city ?? "—"}
                        {ev.location?.mapLink && (
                          <a href={ev.location.mapLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }} title="Open exact location in Google Maps">Map</a>
                        )}
                      </td>
                      <td><span className={`status-badge status-${ev.status}`}>{ev.status}</span></td>
                      <td>{(ev.assignedTeam || []).join(", ") || "—"}</td>
                      <td>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTeamModalEvent(ev)}>Team</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReminder(ev._id)}>Remind</button>
                        {ev.status === "accepted" && <button type="button" className="btn btn-primary btn-sm" onClick={() => updateStatus(ev._id, "in_progress")}>In progress</button>}
                        {ev.status === "in_progress" && <button type="button" className="btn btn-primary btn-sm" onClick={() => updateStatus(ev._id, "completed")}>Complete</button>}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openOrCreateConversation(ev._id)}>Chat</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {section === "calendar" && (
          <section className="section">
            <h2 className="section-title">Calendar view</h2>
            <div className="filters-row" style={{ marginBottom: 16 }}>
              <select value={calendarMonth} onChange={(e) => setCalendarMonth(Number(e.target.value))}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                  <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString("default", { month: "long" })}</option>
                ))}
              </select>
              <select value={calendarYear} onChange={(e) => setCalendarYear(Number(e.target.value))}>
                {[new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 16 }}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.85rem" }}>{d}</div>
              ))}
              {(() => {
                const first = new Date(calendarYear, calendarMonth - 1, 1);
                const startPad = first.getDay();
                const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
                const cells = [];
                for (let i = 0; i < startPad; i++) cells.push(<div key={`p${i}`} />);
                for (let d = 1; d <= daysInMonth; d++) {
                  const date = new Date(calendarYear, calendarMonth - 1, d);
                  const dayEvents = calendarEvents.filter((e) => new Date(e.scheduledAt).toDateString() === date.toDateString());
                  cells.push(
                    <div key={d} style={{ minHeight: 60, padding: 8, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-input)" }}>
                      <strong>{d}</strong>
                      {dayEvents.map((ev) => (
                        <div key={ev._id} style={{ fontSize: "0.75rem", marginTop: 4, color: "var(--primary)" }} title={ev.title}>{ev.title}</div>
                      ))}
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </section>
        )}

        {section === "pending" && (
          <section className="section">
            <h2 className="section-title">Pending events</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Title</th><th>Type</th><th>Scheduled</th><th>City</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {pendingEvents.length === 0 && (
                    <tr><td colSpan={5} style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>No pending events.</td></tr>
                  )}
                  {pendingEvents.map((ev) => (
                    <tr key={ev._id}>
                      <td>{ev.title}</td>
                      <td>{ev.type}</td>
                      <td>{new Date(ev.scheduledAt).toLocaleString()}</td>
                      <td>
                        {ev.location?.city ?? "—"}
                        {ev.location?.mapLink && (
                          <a href={ev.location.mapLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginLeft: 6 }} title="Open exact location">Map</a>
                        )}
                      </td>
                      <td><button type="button" className="btn btn-primary btn-sm" onClick={() => acceptEvent(ev._id)}>Accept</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {section === "nearby" && (
          <section className="section">
            <h2 className="section-title">Events near you</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>Enter your location to see pending events nearby. Get notifications about new bookings in your area.</p>
            <div className="filters-row" style={{ marginBottom: 16 }}>
              <input placeholder="Latitude" value={nearbyLat} onChange={(e) => setNearbyLat(e.target.value)} />
              <input placeholder="Longitude" value={nearbyLng} onChange={(e) => setNearbyLng(e.target.value)} />
              <input type="number" placeholder="Radius (km)" value={nearbyRadius} onChange={(e) => setNearbyRadius(e.target.value)} style={{ width: 100 }} />
              <button type="button" className="btn btn-primary" onClick={loadNearby}>Find nearby</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Title</th><th>Type</th><th>Scheduled</th><th>City</th><th>Distance</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {nearbyEvents.length === 0 && (
                    <tr><td colSpan={6} style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>No events in range. Try a larger radius or different coordinates.</td></tr>
                  )}
                  {nearbyEvents.map((ev) => (
                    <tr key={ev._id}>
                      <td>{ev.title}</td>
                      <td>{ev.type}</td>
                      <td>{new Date(ev.scheduledAt).toLocaleString()}</td>
                      <td>
                        {ev.location?.city ?? "—"}
                        {ev.location?.mapLink && (
                          <a href={ev.location.mapLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginLeft: 6 }} title="Open exact location">Map</a>
                        )}
                      </td>
                      <td>{ev._distanceKm != null ? `${ev._distanceKm.toFixed(1)} km` : "—"}</td>
                      <td><button type="button" className="btn btn-primary btn-sm" onClick={() => acceptEvent(ev._id)}>Accept</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {section === "chat" && (
          <section className="section">
            <h2 className="section-title">Customer contact</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Chat with customers for clarifications, confirm booking details, send updates.</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ minWidth: 200, flex: "1 1 200px" }}>
                <h3 style={{ fontSize: "1rem" }}>Conversations</h3>
                {conversations.length === 0 ? (
                  <p style={{ color: "var(--text-muted)" }}>No conversations yet. Start one from an event (Chat button).</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {conversations.map((c) => (
                      <li key={c._id}>
                        <button
                          type="button"
                          className={`btn btn-sm ${selectedConv?._id === c._id ? "btn-primary" : "btn-secondary"}`}
                          style={{ width: "100%", textAlign: "left", marginBottom: 4 }}
                          onClick={() => setSelectedConv(c)}
                        >
                          {c.event?.title} — {c.user?.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ flex: "2 1 300px" }}>
                {selectedConv ? (
                  <>
                    <h3 style={{ fontSize: "1rem" }}>Chat with {selectedConv.user?.name}</h3>
                    <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 8, background: "var(--bg-input)" }}>
                      {convMessages.map((m, i) => (
                        <div key={i} style={{ marginBottom: 8, textAlign: m.from === "manager" ? "right" : "left" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.from}</span>
                          <div style={{ padding: "4px 8px", borderRadius: 8, display: "inline-block", background: m.from === "manager" ? "var(--primary)" : "var(--border)" }}>{m.text}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type message..." style={{ flex: 1 }} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                      <button type="button" className="btn btn-primary" onClick={sendMessage}>Send</button>
                    </div>
                  </>
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>Select a conversation.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {section === "resources" && (
          <section className="section">
            <h2 className="section-title">Resource management</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Track inventory: decorations, equipment, catering. Manage availability.</p>
            <form onSubmit={addResource} style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
              <input placeholder="Item name" value={resourceForm.name} onChange={(e) => setResourceForm((f) => ({ ...f, name: e.target.value }))} required />
              <select value={resourceForm.type} onChange={(e) => setResourceForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="decoration">Decoration</option>
                <option value="equipment">Equipment</option>
                <option value="catering">Catering</option>
                <option value="other">Other</option>
              </select>
              <input type="number" min={0} value={resourceForm.quantity} onChange={(e) => setResourceForm((f) => ({ ...f, quantity: e.target.value }))} style={{ width: 80 }} />
              <input placeholder="Unit" value={resourceForm.unit} onChange={(e) => setResourceForm((f) => ({ ...f, unit: e.target.value }))} style={{ width: 60 }} />
              <button type="submit" className="btn btn-primary">Add</button>
            </form>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Type</th><th>Qty</th><th>Available</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {resources.length === 0 && (
                    <tr><td colSpan={5} style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>No resources. Add items above.</td></tr>
                  )}
                  {resources.map((r) => (
                    <tr key={r._id}>
                      <td>{r.name}</td>
                      <td>{r.type}</td>
                      <td>{r.quantity} {r.unit}</td>
                      <td>
                        <button type="button" className={`btn btn-sm ${r.available ? "btn-primary" : "btn-secondary"}`} onClick={() => toggleResourceAvailable(r._id, !r.available)}>
                          {r.available ? "Yes" : "No"}
                        </button>
                      </td>
                      <td><button type="button" className="btn btn-danger btn-sm" onClick={() => deleteResource(r._id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {section === "performance" && (
          <section className="section">
            <h2 className="section-title">Performance tracking</h2>
            {performance && (
              <div style={{ marginBottom: 24, padding: 16, background: "var(--bg-input)", borderRadius: 8 }}>
                <p><strong>Completion rate:</strong> {performance.completionRate}% ({performance.completed} / {performance.total} events)</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>By status: {Object.entries(performance.byStatus || {}).map(([k, v]) => `${k}: ${v}`).join(", ")}</p>
              </div>
            )}
            <h3 style={{ fontSize: "1rem" }}>Customer feedback</h3>
            {feedbackList.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No feedback yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {feedbackList.map((f) => (
                  <li key={f._id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <strong>{f.event?.title}</strong> — {f.rating}★ by {f.user?.name}
                    {f.comment && <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>{f.comment}</p>}
                    {f.managerReply && <p style={{ margin: "6px 0 0", paddingLeft: 12, borderLeft: "3px solid var(--primary)", fontSize: "0.9rem" }}><strong>Your reply:</strong> {f.managerReply}</p>}
                    {!f.managerReply && (
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input placeholder="Respond to review..." value={feedbackReply[f._id] ?? ""} onChange={(e) => setFeedbackReply((r) => ({ ...r, [f._id]: e.target.value }))} style={{ flex: 1, minWidth: 160 }} />
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => replyToFeedback(f._id, feedbackReply[f._id])}>Reply</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {section === "notifications" && (
          <section className="section">
            <h2 className="section-title">Notifications</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Reminders and alerts for your events.</p>
            {notifications.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No notifications.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {notifications.map((n) => (
                  <li key={n._id} style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
                    <strong>{n.title}</strong>
                    {n.body && <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>{n.body}</p>}
                    <small>{new Date(n.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {section === "performed" && (
          <section className="section">
            <h2 className="section-title">My performed events</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Upload events you have performed or completed. They will appear in that category for users when they browse similar events.</p>
            <p style={{ marginBottom: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => loadPerformedEvents()}>Refresh list</button>
              {error && error.includes("Backend returned") && (
                <span style={{ marginLeft: 12, color: "var(--text-muted)", fontSize: "0.9rem" }}>Backend not reachable — start it then click Refresh.</span>
              )}
            </p>
            <form onSubmit={addPerformedEvent} style={{ marginBottom: 24, padding: 16, background: "var(--bg)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: "1rem" }}>Add performed event</h3>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Event type</label>
                  <select value={performedEventForm.type} onChange={(e) => setPerformedEventForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="birthday">Birthday</option>
                    <option value="surprise">Surprise</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="farewell">Farewell</option>
                    <option value="software_launch">Software launch</option>
                    <option value="corporate">Corporate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input value={performedEventForm.title} onChange={(e) => setPerformedEventForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Birthday at Grand Hall" required />
                </div>
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea value={performedEventForm.description} onChange={(e) => setPerformedEventForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief description of the event" />
              </div>
              <div className="form-group">
                <label>Image URL (optional)</label>
                <input type="url" value={performedEventForm.imageUrl} onChange={(e) => setPerformedEventForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Venue (optional)</label>
                  <input value={performedEventForm.venue} onChange={(e) => setPerformedEventForm((f) => ({ ...f, venue: e.target.value }))} placeholder="e.g. Grand Hall" />
                </div>
                <div className="form-group">
                  <label>Guest count (optional)</label>
                  <input type="number" min={0} value={performedEventForm.guestCount} onChange={(e) => setPerformedEventForm((f) => ({ ...f, guestCount: e.target.value }))} placeholder="50" />
                </div>
              </div>
              <div className="form-group">
                <label>Date performed (optional)</label>
                <input type="date" value={performedEventForm.performedAt} onChange={(e) => setPerformedEventForm((f) => ({ ...f, performedAt: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={performedEventSaving}>{performedEventSaving ? "Adding…" : "Add performed event"}</button>
            </form>
            <h3 style={{ marginBottom: 12, fontSize: "1rem" }}>Your uploaded events</h3>
            {performedEvents.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No performed events yet. Add one above to show it in that category to users.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {performedEvents.map((ev) => (
                  <li key={ev._id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    {ev.imageUrl && <img src={ev.imageUrl} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />}
                    <div style={{ flex: 1 }}>
                      <strong>{ev.title}</strong> · {ev.type.replace(/_/g, " ")} {ev.venue && `· ${ev.venue}`} {ev.guestCount ? `· ${ev.guestCount} guests` : ""} · {ev.performedAt ? new Date(ev.performedAt).toLocaleDateString() : "—"}
                      {ev.description && <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>{ev.description}</p>}
                    </div>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => deletePerformedEvent(ev._id)}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {section === "profile" && (
          <section className="section">
            <h2 className="section-title">Profile</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Update your details. This helps with event management and customer communication.</p>
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
              <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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

      {teamModalEvent && (
        <Modal open={!!teamModalEvent} onClose={() => setTeamModalEvent(null)} title="Assign team">
          <p style={{ color: "var(--text-muted)", marginBottom: 8 }}>Comma-separated names for event: {teamModalEvent.title}</p>
          <input value={teamInput} onChange={(e) => setTeamInput(e.target.value)} placeholder="e.g. John, Jane, Mike" style={{ width: "100%", marginBottom: 12 }} />
          <button type="button" className="btn btn-primary" onClick={() => assignTeam(teamModalEvent._id, teamInput)}>Save</button>
        </Modal>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Error" type="error">
        <p>{error}</p>
      </Modal>
    </div>
  );
}

export default ManagerDashboard;
