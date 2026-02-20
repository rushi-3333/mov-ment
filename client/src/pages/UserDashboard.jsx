import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import ProfileDropdown from "../components/ProfileDropdown";

const _apiUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "";
const API_BASE = (_apiUrl && _apiUrl !== "/") ? _apiUrl : "http://localhost:5000";

async function parseJsonResponse(res) {
  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.startsWith("<") || trimmed.toLowerCase().startsWith("<!doctype")) {
    throw new Error(
      "Backend not responding. Start the API: from the project root run 'npm start', or in a separate terminal run 'cd server && node index.js'. The backend must run on port 5000 (or set VITE_API_URL in client .env)."
    );
  }
  try {
    return trimmed ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error("Invalid response from server. Check that the API is running on " + API_BASE);
  }
}

const DEFAULT_FAQ = [
  { q: "How do I book an event?", a: "Log in, go to Book event, fill in type, date, venue, and optional services. Submit to create a booking." },
  { q: "Can I cancel or reschedule?", a: "Yes. From My events you can cancel or reschedule events that are still pending or accepted." },
  { q: "How do I get a receipt?", a: "Open the event in your booking history and use the Invoice button to download." },
  { q: "What payment methods are accepted?", a: "We accept card, UPI, wallets, and net banking. Split payment can be arranged for group events." },
  { q: "How do I contact support?", a: "Use the Support section to raise a query or complaint. We respond within 24 hours." },
];

const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

const ShareIcon = () => (
  <svg {...iconProps}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
);

const InvoiceIcon = () => (
  <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
);

const WhatsAppIcon = () => (
  <svg {...iconProps}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
);

const EmailIcon = () => (
  <svg {...iconProps}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);

const CalendarIcon = () => (
  <svg {...iconProps}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);

const FeedbackIcon = () => (
  <svg {...iconProps}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);

const SurveyIcon = () => (
  <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
);

function UserDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [faq, setFaq] = useState([]);
  const [meta, setMeta] = useState({ eventTypes: [], additionalServices: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [form, setForm] = useState({
    type: "birthday",
    title: "",
    description: "",
    scheduledAt: "",
    addressLine: "",
    city: "",
    pincode: "",
    landmark: "",
    lat: "",
    lng: "",
    mapLink: "",
    guestCount: 1,
    venue: "",
    additionalServices: [], // [{ service, description, image }]
    customRequests: "",
  });
  const [supportForm, setSupportForm] = useState({ subject: "", message: "", category: "query" });
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [feedbackEvent, setFeedbackEvent] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorQr, setTwoFactorQr] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [newConvMessage, setNewConvMessage] = useState("");
  const [eventSearch, setEventSearch] = useState({ type: "", venue: "", status: "" });
  const [suggestionMeta, setSuggestionMeta] = useState(null);
  const [surveyEvent, setSurveyEvent] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [managerRequest, setManagerRequest] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", city: "", area: "", addressLine: "", profilePicture: "" });
  const [openActionsId, setOpenActionsId] = useState(null);

  const token = localStorage.getItem("token");
  const userName = profile?.name || localStorage.getItem("userName") || "User";
  const role = localStorage.getItem("role") || "user";

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

  const loadEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/events/my`, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to load events");
      setEvents(data);
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/notifications`, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setNotifications(data);
    } catch (_) {}
  };

  const loadTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/support`, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setTickets(data);
    } catch (_) {}
  };

  const loadPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/payments`, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setPayments(data);
    } catch (_) {}
  };

  const loadFaq = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/faq`);
      const data = await parseJsonResponse(res);
      if (res.ok && Array.isArray(data) && data.length) setFaq(data);
      else setFaq(DEFAULT_FAQ);
    } catch (_) {
      setFaq(DEFAULT_FAQ);
    }
  };

  const loadMeta = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/events/meta`);
      const data = await parseJsonResponse(res);
      if (res.ok) setMeta({ eventTypes: data.eventTypes || [], additionalServices: data.additionalServices || [] });
    } catch (_) {}
  };

  const loadSuggestions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/events/suggestions?guestCount=${form.guestCount || 10}`, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) {
        setSuggestions(Array.isArray(data) ? data : (data.suggestions || []));
        setSuggestionMeta(data.suggestedStaffing ? { suggestedStaffing: data.suggestedStaffing, venueTypes: data.venueTypes || [] } : null);
      }
    } catch (_) {}
  };

  const loadConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/conversations`, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load conversations");
      setModalOpen(true);
    }
  };

  const loadConvMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/conversations/${convId}/messages`, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setConvMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load messages");
      setModalOpen(true);
    }
  };

  const openConversationForEvent = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE}/api/user/conversations/for-event/${eventId}`, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Could not open chat");
      setSelectedConv(data);
      setSection("chat");
      loadConversations();
      loadConvMessages(data._id);
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const sendConvMessage = async () => {
    if (!selectedConv || !newConvMessage.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/conversations/${selectedConv._id}/messages`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ text: newConvMessage.trim() }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to send");
      setConvMessages(Array.isArray(data) ? data : []);
      setNewConvMessage("");
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const fetchAll = () => {
    loadEvents();
    loadNotifications();
    loadTickets();
    loadPayments();
  };

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    loadEvents();
    loadMeta();
    loadSuggestions();
    loadFaq();
    loadProfile();
  }, []);

  useEffect(() => {
    if (section === "book") loadSuggestions();
  }, [form.guestCount]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);

  useEffect(() => {
    if (section === "notifications") loadNotifications();
    if (section === "support") loadTickets();
    if (section === "payments") loadPayments();
    if (section === "faq") loadFaq();
    if (section === "chat") loadConversations();
    if (section === "settings") loadManagerRequest();
    if (section === "profile") loadProfile();
  }, [section]);

  useEffect(() => {
    if (selectedConv?._id) loadConvMessages(selectedConv._id);
  }, [selectedConv?._id]);

  useEffect(() => {
    if (surveyEvent) loadSurveyQuestions();
  }, [surveyEvent]);

  useEffect(() => {
    if (!openActionsId) return;
    const close = (e) => {
      if (!e.target.closest(".booking-actions-dropdown")) setOpenActionsId(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openActionsId]);

  const loadManagerRequest = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/manager-request`, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setManagerRequest(data);
    } catch (_) {}
  };

  const requestManagerRole = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/request-manager`, { method: "POST", headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed");
      loadManagerRequest();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, { headers: headers() });
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
        headers: json(),
        body: JSON.stringify({
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          profilePicture: profileForm.profilePicture.trim(),
          location: {
            city: profileForm.city.trim(),
            area: profileForm.area.trim(),
            addressLine: profileForm.addressLine.trim(),
          },
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "additionalServices") {
      const opts = e.target.options;
      const selected = [];
      for (let i = 0; i < opts.length; i++) if (opts[i].selected) selected.push(opts[i].value);
      setForm((f) => ({ ...f, [name]: selected }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const applySuggestion = (s) => {
    setForm((f) => ({
      ...f,
      type: s.type,
      additionalServices: (s.services || []).slice(0, 1).map((service) => ({ service, description: "", image: "" })),
    }));
    setSection("book");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      additionalServices: (form.additionalServices || []).map((x) => (typeof x === "string" ? { service: x, description: "", image: "" } : x)),
    };
    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify(payload),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to create event");
      setForm((f) => ({ ...f, title: "", description: "", customRequests: "" }));
      loadEvents();
      loadNotifications();
      setSection("events");
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const cancelEvent = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${id}/cancel`, { method: "POST", headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to cancel");
      loadEvents();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const rescheduleEvent = async () => {
    if (!rescheduleId || !rescheduleAt) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${rescheduleId}/reschedule`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ scheduledAt: rescheduleAt }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to reschedule");
      setRescheduleId(null);
      setRescheduleAt("");
      loadEvents();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackEvent) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/events/${feedbackEvent._id}/feedback`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to submit feedback");
      setFeedbackEvent(null);
      setFeedbackComment("");
      setFeedbackRating(5);
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const downloadInvoice = async (eventId) => {
    try {
      const url = `${API_BASE}/api/user/invoice/${eventId}?format=pdf`;
      const res = await fetch(url, { headers: headers() });
      if (checkAuth(res)) return;
      if (!res.ok) {
        const data = await parseJsonResponse(res).catch(() => ({}));
        throw new Error(data.message || "Failed to load invoice");
      }
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("Invoice PDF is empty");
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `invoice-${String(eventId).replace(/[^a-zA-Z0-9-_]/g, "")}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch (err) {
      const msg = err.message || "";
      setError(
        msg.includes("page instead of data")
          ? "Could not reach the server. Start the backend (in the server folder run: node index.js), then try Invoice again."
          : msg
      );
      setModalOpen(true);
    }
  };

  const submitSupport = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/user/support`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify(supportForm),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed to submit");
      setSupportForm({ subject: "", message: "", category: "query" });
      loadTickets();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await fetch(`${API_BASE}/api/user/notifications/${id}/read`, { method: "PATCH", headers: headers() });
      loadNotifications();
    } catch (_) {}
  };

  const enable2FA = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/2fa/enable`, { method: "POST", headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed");
      setTwoFactorQr(data);
      setTwoFactorCode("");
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const verify2FA = async (e) => {
    e.preventDefault();
    if (!twoFactorCode) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/2fa/verify`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ code: twoFactorCode }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Invalid code");
      setTwoFactorQr(null);
      setTwoFactorCode("");
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const upcomingEvents = events.filter((e) => !["cancelled", "completed"].includes(e.status) && new Date(e.scheduledAt) > new Date()).slice(0, 5);

  const filteredEvents = events.filter((ev) => {
    if (eventSearch.type && String(ev.type) !== eventSearch.type) return false;
    if (eventSearch.status && String(ev.status) !== eventSearch.status) return false;
    if (eventSearch.venue && !(ev.venue || "").toLowerCase().includes(eventSearch.venue.toLowerCase())) return false;
    return true;
  });

  const toICSDate = (d) => {
    const x = new Date(d);
    return x.toISOString().replace(/[-:]/g, "").slice(0, 15);
  };
  const calendarLinks = (ev) => {
    const start = new Date(ev.scheduledAt);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const title = encodeURIComponent(ev.title || "Event");
    const startStr = toICSDate(start);
    const endStr = toICSDate(end);
    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}`,
      outlook: `https://outlook.live.com/calendar/0/action/compose?subject=${title}&startdt=${start.toISOString()}&enddt=${end.toISOString()}`,
    };
  };

  const loadSurveyQuestions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/survey/questions`, { headers: headers() });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (res.ok) setSurveyQuestions(Array.isArray(data) ? data : []);
    } catch (_) {}
  };

  const submitSurvey = async () => {
    if (!surveyEvent) return;
    const answers = surveyQuestions.map((q) => ({ questionId: q.id, question: q.question, value: surveyAnswers[q.id] }));
    try {
      const res = await fetch(`${API_BASE}/api/user/events/${surveyEvent._id}/survey`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify({ answers }),
      });
      if (checkAuth(res)) return;
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || "Failed");
      setSurveyEvent(null);
      setSurveyAnswers({});
      loadEvents();
    } catch (err) {
      setError(err.message);
      setModalOpen(true);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const openSection = (s) => {
    setSection(s);
    setSidebarOpen(false);
  };

  const selectedService = (form.additionalServices || [])[0] ? (typeof (form.additionalServices || [])[0] === "string" ? (form.additionalServices || [])[0] : (form.additionalServices || [])[0].service) : null;

  const selectService = (serviceName) => {
    setForm((f) => {
      const current = (f.additionalServices || [])[0];
      const currentName = current ? (typeof current === "string" ? current : current.service) : null;
      if (currentName === serviceName) return { ...f, additionalServices: [] };
      const existing = (f.additionalServices || []).find((x) => (typeof x === "string" ? x : x.service) === serviceName);
      const detail = existing && typeof existing !== "string" ? existing : { service: serviceName, description: "", image: "" };
      return { ...f, additionalServices: [detail] };
    });
  };

  const updateServiceDetail = (serviceName, field, value) => {
    setForm((f) => ({
      ...f,
      additionalServices: (f.additionalServices || []).map((x) => {
        const s = typeof x === "string" ? x : x.service;
        if (s !== serviceName) return x;
        const obj = typeof x === "string" ? { service: x, description: "", image: "" } : { ...x };
        obj[field] = value;
        return obj;
      }),
    }));
  };

  const onServiceImageChange = (serviceName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateServiceDetail(serviceName, "image", reader.result);
    reader.readAsDataURL(file);
  };

  const isServiceChecked = (serviceName) => selectedService === serviceName;

  const getServiceDetail = (serviceName) => {
    const x = (form.additionalServices || []).find((item) => (typeof item === "string" ? item : item.service) === serviceName);
    if (!x) return { service: serviceName, description: "", image: "" };
    return typeof x === "string" ? { service: x, description: "", image: "" } : { service: x.service, description: x.description || "", image: x.image || "" };
  };

  const eventTypes = meta.eventTypes.length ? meta.eventTypes : ["birthday", "surprise", "anniversary", "farewell", "software_launch", "corporate", "other"];
  const additionalServices = meta.additionalServices.length ? meta.additionalServices : ["decoration", "food", "equipment", "photography", "music_dj", "catering", "venue_setup"];

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
            { id: "book", label: "Book event" },
            { id: "events", label: "My events" },
            { id: "notifications", label: `Notifications ${notifications.filter((n) => !n.read).length ? `(${notifications.filter((n) => !n.read).length})` : ""}` },
            { id: "chat", label: "Chat with manager" },
            { id: "support", label: "Support" },
            { id: "payments", label: "Payments" },
            { id: "faq", label: "FAQ" },
            { id: "profile", label: "Profile" },
            { id: "settings", label: "Security (2FA)" },
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
            <h1 className="dashboard-title">Mov<span style={{ color: "var(--primary)" }}>-</span>Ment · Customer</h1>
            <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>Logged in as <strong>{userName}</strong></p>
          </div>
          <ProfileDropdown
            userName={userName}
            profilePictureUrl={profile?.profilePicture || undefined}
            onProfile={() => openSection("profile")}
            onSettings={() => openSection("settings")}
            onRefresh={fetchAll}
            onLogout={logout}
          />
        </header>

        {section === "dashboard" && (
          <>
            <section className="section">
              <h2 className="section-title">Upcoming events</h2>
              {upcomingEvents.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No upcoming events. <button type="button" className="btn btn-primary btn-sm" onClick={() => openSection("book")}>Book one</button></p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {upcomingEvents.map((ev) => (
                    <li key={ev._id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <strong>{ev.title}</strong> — {new Date(ev.scheduledAt).toLocaleString()} · {ev.status}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {suggestions.length > 0 && (
              <section className="section">
                <h2 className="section-title">Suggested packages</h2>
                {suggestionMeta?.suggestedStaffing && (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 8 }}>
                    Suggested staffing for your guest count: {suggestionMeta.suggestedStaffing.min}–{suggestionMeta.suggestedStaffing.max} team member(s).
                  </p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" className="btn btn-secondary btn-sm" onClick={() => applySuggestion(s)} title={s.theme ? `Theme: ${s.theme}` : ""}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {suggestionMeta?.venueTypes?.length > 0 && (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 8 }}>Venue types: {suggestionMeta.venueTypes.join(", ")}</p>
                )}
              </section>
            )}
          </>
        )}

        {section === "book" && (
          <section className="section">
            <h2 className="section-title">Create event booking</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Event type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    {eventTypes.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Birthday surprise" required />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Date & time</label>
                  <input type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Number of guests</label>
                  <input type="number" min={1} name="guestCount" value={form.guestCount} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Venue name (optional)</label>
                <input name="venue" value={form.venue} onChange={handleChange} placeholder="e.g. Grand Hall" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input name="addressLine" value={form.addressLine} onChange={handleChange} placeholder="Street, building" required />
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>City</label>
                  <input name="city" value={form.city} onChange={handleChange} placeholder="City" required />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" required />
                </div>
                <div className="form-group">
                  <label>Landmark</label>
                  <input name="landmark" value={form.landmark} onChange={handleChange} placeholder="Optional" />
                </div>
              </div>
              <div className="form-group">
                <label>Exact location (Google Maps)</label>
                <input
                  name="mapLink"
                  type="url"
                  value={form.mapLink}
                  onChange={handleChange}
                  placeholder="Paste Google Maps share link for exact location"
                />
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6 }}>
                  In Google Maps, find the spot → Share → Copy link. Paste it here so the manager gets the exact location.
                </p>
              </div>
              <div className="form-group additional-services-group">
                <label>Additional services</label>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>Choose one. The common space below shows details for the selected service.</p>
                <div className="service-radio-card">
                  {additionalServices.map((s) => (
                    <label key={s} className={`service-radio-option ${isServiceChecked(s) ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="additionalService"
                        checked={isServiceChecked(s)}
                        onChange={() => selectService(s)}
                      />
                      <span className="service-radio-dot" />
                      <span className="service-radio-label">{s.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
                {selectedService && (
                  <div className="service-options-shared service-options-below">
                    <div className="service-option-heading">{selectedService.replace(/_/g, " ")}</div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: "0.85rem" }}>Description (optional)</label>
                      <textarea
                        placeholder={`e.g. Theme, colors, specific ${selectedService.replace(/_/g, " ")} preferences`}
                        value={getServiceDetail(selectedService).description}
                        onChange={(e) => updateServiceDetail(selectedService, "description", e.target.value)}
                        rows={2}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: "0.85rem" }}>Upload reference image (optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onServiceImageChange(selectedService, e)}
                        style={{ fontSize: "0.85rem" }}
                      />
                    </div>
                    {getServiceDetail(selectedService).image && (
                      <div className="service-image-preview">
                        <img src={getServiceDetail(selectedService).image} alt="" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} />
              </div>
              <div className="form-group">
                <label>Custom requests</label>
                <textarea name="customRequests" value={form.customRequests} onChange={handleChange} placeholder="Special arrangements, dietary needs, etc." rows={2} />
              </div>
              <button type="submit" className="btn btn-primary">Create booking</button>
            </form>
          </section>
        )}

        {section === "events" && (
          <section className="section" id="booking-history">
            <h2 className="section-title">Booking history</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>Search by event type, venue, or status.</p>
            <div className="filters-row" style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <select value={eventSearch.type} onChange={(e) => setEventSearch((s) => ({ ...s, type: e.target.value }))}>
                <option value="">All types</option>
                {(meta.eventTypes || []).map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
              <select value={eventSearch.status} onChange={(e) => setEventSearch((s) => ({ ...s, status: e.target.value }))}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input placeholder="Search venue..." value={eventSearch.venue} onChange={(e) => setEventSearch((s) => ({ ...s, venue: e.target.value }))} style={{ minWidth: 140 }} />
            </div>
            <div className="table-wrap">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Scheduled</th>
                    <th>Guests</th>
                    <th>Status</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>No events match your filters.</td>
                    </tr>
                  )}
                  {filteredEvents.map((ev) => (
                    <tr key={ev._id}>
                      <td><strong>{ev.title}</strong></td>
                      <td>{String(ev.type).replace(/_/g, " ")}</td>
                      <td>{new Date(ev.scheduledAt).toLocaleString()}</td>
                      <td>{ev.guestCount || 1}</td>
                      <td><span className={`status-badge status-${ev.status}`}>{ev.status}</span></td>
                      <td className="actions-col">
                        <div className="booking-actions">
                          <div className="booking-actions-dropdown">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={(e) => { e.stopPropagation(); setOpenActionsId(openActionsId === ev._id ? null : ev._id); }}
                              aria-haspopup="true"
                              aria-expanded={openActionsId === ev._id}
                            >
                              Actions ▾
                            </button>
                            {openActionsId === ev._id && (
                              <div className="booking-actions-menu">
                                <button type="button" className="booking-actions-item" onClick={() => { downloadInvoice(ev._id); setOpenActionsId(null); }}>
                                  <InvoiceIcon /><span>Invoice</span>
                                </button>
                                <button
                                  type="button"
                                  className="booking-actions-item"
                                  onClick={() => {
                                    const url = window.location.origin + "/user";
                                    const text = `Join my event: ${ev.title} on ${new Date(ev.scheduledAt).toLocaleString()}`;
                                    if (navigator.share) navigator.share({ title: ev.title, text, url }).catch(() => {});
                                    else { navigator.clipboard.writeText(`${text}\n${url}`); setError("Link copied to clipboard"); setModalOpen(true); setTimeout(() => setModalOpen(false), 2000); }
                                    setOpenActionsId(null);
                                  }}
                                >
                                  <ShareIcon /><span>Share</span>
                                </button>
                                <button type="button" className="booking-actions-item" onClick={() => { const text = encodeURIComponent(`You're invited to: ${ev.title} on ${new Date(ev.scheduledAt).toLocaleString()}. Details: ${window.location.origin}/user`); window.open(`https://wa.me/?text=${text}`, "_blank"); setOpenActionsId(null); }}>
                                  <WhatsAppIcon /><span>WhatsApp</span>
                                </button>
                                <a href={`mailto:?subject=Invitation: ${ev.title}&body=You're invited to ${ev.title} on ${new Date(ev.scheduledAt).toLocaleString()}.`} className="booking-actions-item" onClick={() => setOpenActionsId(null)}>
                                  <EmailIcon /><span>Email</span>
                                </a>
                                <a href={calendarLinks(ev).google} target="_blank" rel="noopener noreferrer" className="booking-actions-item" onClick={() => setOpenActionsId(null)}>
                                  <CalendarIcon /><span>Google Calendar</span>
                                </a>
                                <a href={calendarLinks(ev).outlook} target="_blank" rel="noopener noreferrer" className="booking-actions-item" onClick={() => setOpenActionsId(null)}>
                                  <CalendarIcon /><span>Outlook</span>
                                </a>
                                {ev.status === "completed" && (
                                  <>
                                    <button type="button" className="booking-actions-item" onClick={() => { setFeedbackEvent(ev); setFeedbackRating(5); setFeedbackComment(""); setOpenActionsId(null); }}>
                                      <FeedbackIcon /><span>Leave feedback</span>
                                    </button>
                                    <button type="button" className="booking-actions-item" onClick={() => { setSurveyEvent(ev); setOpenActionsId(null); }}>
                                      <SurveyIcon /><span>Post-event survey</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {["accepted", "in_progress"].includes(ev.status) && ev.assignedManager && (
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openConversationForEvent(ev._id)} title="Chat with manager">Chat</button>
                          )}
                          {["pending", "accepted"].includes(ev.status) && (
                            <>
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => cancelEvent(ev._id)}>Cancel</button>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setRescheduleId(ev._id); setRescheduleAt(""); }}>Reschedule</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rescheduleId && (
              <div style={{ marginTop: 16, padding: 16, background: "var(--bg-input)", borderRadius: 8 }}>
                <label>New date & time</label>
                <input type="datetime-local" value={rescheduleAt} onChange={(e) => setRescheduleAt(e.target.value)} style={{ marginRight: 8 }} />
                <button type="button" className="btn btn-primary btn-sm" onClick={rescheduleEvent}>Save</button>
                <button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }} onClick={() => setRescheduleId(null)}>Cancel</button>
              </div>
            )}
          </section>
        )}

        {section === "chat" && (
          <section className="section">
            <h2 className="section-title">Chat with manager</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Send and receive messages with the manager for your event. You can also open chat from the Chat button on an event in Booking history.</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ minWidth: 220, flex: "1 1 220px" }}>
                <h3 style={{ fontSize: "1rem" }}>Conversations</h3>
                {conversations.length === 0 ? (
                  <p style={{ color: "var(--text-muted)" }}>No conversations yet. When a manager is assigned to your event, use the Chat button on that event to start.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {conversations.map((c) => (
                      <li key={c._id}>
                        <button
                          type="button"
                          className={`btn btn-sm ${selectedConv?._id === c._id ? "btn-primary" : "btn-secondary"}`}
                          style={{ width: "100%", textAlign: "left", marginBottom: 6 }}
                          onClick={() => setSelectedConv(c)}
                        >
                          {c.event?.title ?? "Event"} — {c.manager?.name ?? "Manager"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ flex: "2 1 300px" }}>
                {selectedConv ? (
                  <>
                    <h3 style={{ fontSize: "1rem" }}>Chat with {selectedConv.manager?.name ?? "manager"}</h3>
                    <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 8, background: "var(--bg-input)" }}>
                      {convMessages.length === 0 && <p style={{ color: "var(--text-muted)" }}>No messages yet. Say hello!</p>}
                      {convMessages.map((m, i) => (
                        <div key={i} style={{ marginBottom: 8, textAlign: m.from === "user" ? "right" : "left" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.from === "user" ? "You" : selectedConv.manager?.name ?? "Manager"}</span>
                          <div style={{ padding: "6px 10px", borderRadius: 8, display: "inline-block", background: m.from === "user" ? "var(--primary)" : "var(--border)", color: m.from === "user" ? "#fff" : "var(--text)" }}>{m.text}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={newConvMessage} onChange={(e) => setNewConvMessage(e.target.value)} placeholder="Type message..." style={{ flex: 1 }} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendConvMessage()} />
                      <button type="button" className="btn btn-primary" onClick={sendConvMessage}>Send</button>
                    </div>
                  </>
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>Select a conversation or open Chat from an event in Booking history.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {section === "notifications" && (
          <section className="section">
            <h2 className="section-title">Notifications</h2>
            {notifications.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No notifications yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {notifications.map((n) => (
                  <li
                    key={n._id}
                    style={{
                      padding: 12,
                      borderBottom: "1px solid var(--border)",
                      background: n.read ? "transparent" : "rgba(99,102,241,0.08)",
                    }}
                  >
                    <strong>{n.title}</strong>
                    {n.body && <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>{n.body}</p>}
                    <small style={{ color: "var(--text-muted)" }}>{new Date(n.createdAt).toLocaleString()}</small>
                    {!n.read && (
                      <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 8 }} onClick={() => markNotificationRead(n._id)}>Mark read</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {section === "support" && (
          <section className="section">
            <h2 className="section-title">Customer support</h2>
            <form onSubmit={submitSupport} style={{ marginBottom: 24 }}>
              <div className="form-group">
                <label>Category</label>
                <select value={supportForm.category} onChange={(e) => setSupportForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="query">Query</option>
                  <option value="complaint">Complaint</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input value={supportForm.subject} onChange={(e) => setSupportForm((f) => ({ ...f, subject: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea value={supportForm.message} onChange={(e) => setSupportForm((f) => ({ ...f, message: e.target.value }))} rows={4} required />
              </div>
              <button type="submit" className="btn btn-primary">Submit</button>
            </form>
            <h3 style={{ fontSize: "1rem" }}>Your tickets</h3>
            {tickets.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No tickets yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {tickets.map((t) => (
                  <li key={t._id} style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
                    <strong>{t.subject}</strong> — {t.status} · {new Date(t.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {section === "payments" && (
          <section className="section">
            <h2 className="section-title">Payments & receipts</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Pay via card, UPI, wallets, or net banking. Receipts appear below after payment.</p>
            {payments.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No payments yet. Pay from a booking in My events when available.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td>{p.event?.title || p.event}</td>
                        <td>₹{p.amount}</td>
                        <td>{p.status}</td>
                        <td>{new Date(p.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {section === "faq" && (
          <section className="section" id="faq">
            <h2 className="section-title">FAQ</h2>
            {faq.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No FAQ entries at the moment.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {faq.map((item, i) => (
                  <details key={i} style={{ padding: 12, background: "var(--bg-input)", borderRadius: 8 }}>
                    <summary style={{ fontWeight: 600, cursor: "pointer" }}>{item.q}</summary>
                    <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>{item.a}</p>
                  </details>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "profile" && (
          <section className="section">
            <h2 className="section-title">Profile</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Update your personal details. These help us manage events and serve you better.</p>
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label>Profile picture (URL)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={profileForm.profilePicture}
                  onChange={(e) => setProfileForm((f) => ({ ...f, profilePicture: e.target.value }))}
                />
                {profileForm.profilePicture && (
                  <div style={{ marginTop: 8 }}>
                    <img src={profileForm.profilePicture} alt="Preview" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="form-grid-2">
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

        {section === "settings" && (
          <>
            <section className="section">
              <h2 className="section-title">Two-factor authentication</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Add an extra layer of security with an authenticator app (Google Authenticator, Authy, etc.).</p>
              {!twoFactorQr ? (
                <button type="button" className="btn btn-primary" onClick={enable2FA}>Enable 2FA</button>
              ) : (
                <form onSubmit={verify2FA}>
                  <p>Scan the QR code in your app, then enter the 6-digit code below.</p>
                  <p style={{ wordBreak: "break-all", fontSize: "0.85rem", color: "var(--text-muted)" }}>Or enter this secret: {twoFactorQr.secret}</p>
                  <div className="form-group">
                    <label>Code</label>
                    <input type="text" placeholder="000000" maxLength={6} value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))} />
                  </div>
                  <button type="submit" className="btn btn-primary">Verify & enable</button>
                </form>
              )}
            </section>
            {role === "user" && (
              <section className="section">
                <h2 className="section-title">Request manager role</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Request to become a manager so you can create and manage events. An admin will review your request.</p>
                {managerRequest ? (
                  <p style={{ color: "var(--text-muted)" }}>
                    Status: <strong>{managerRequest.status}</strong>
                    {managerRequest.processedAt && ` (${new Date(managerRequest.processedAt).toLocaleDateString()})`}
                    {managerRequest.status === "rejected" && (
                      <span style={{ marginLeft: 8 }}>
                        <button type="button" className="btn btn-primary btn-sm" onClick={requestManagerRole}>Request again</button>
                      </span>
                    )}
                  </p>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={requestManagerRole}>Request to become a manager</button>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {feedbackEvent && (
        <Modal open={!!feedbackEvent} onClose={() => setFeedbackEvent(null)} title="Leave feedback">
          <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>Rate your experience for: {feedbackEvent.title}</p>
          <div className="form-group">
            <label>Rating (1–5)</label>
            <select value={feedbackRating} onChange={(e) => setFeedbackRating(Number(e.target.value))}>
              {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Comment (optional)</label>
            <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} rows={3} placeholder="How was the event?" />
          </div>
          <button type="button" className="btn btn-primary" onClick={submitFeedback}>Submit feedback</button>
        </Modal>
      )}

      {surveyEvent && (
        <Modal open={!!surveyEvent} onClose={() => { setSurveyEvent(null); setSurveyAnswers({}); }} title="Post-event survey">
          <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>Help us improve. Event: {surveyEvent.title}</p>
          {surveyQuestions.map((q) => (
            <div key={q.id} className="form-group" style={{ marginBottom: 12 }}>
              <label>{q.question}</label>
              {q.type === "rating" && (
                <select value={surveyAnswers[q.id] ?? ""} onChange={(e) => setSurveyAnswers((a) => ({ ...a, [q.id]: Number(e.target.value) }))}>
                  <option value="">Select</option>
                  {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
              {q.type === "text" && (
                <textarea value={surveyAnswers[q.id] ?? ""} onChange={(e) => setSurveyAnswers((a) => ({ ...a, [q.id]: e.target.value }))} rows={2} placeholder="Optional" />
              )}
            </div>
          ))}
          <button type="button" className="btn btn-primary" onClick={submitSurvey}>Submit survey</button>
        </Modal>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Error" type="error">
        <p>{error}</p>
      </Modal>
    </div>
  );
}

export default UserDashboard;
