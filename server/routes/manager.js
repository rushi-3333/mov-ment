const router = require("express").Router();
const auth = require("../middleware/auth");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const ManagerConversation = require("../models/ManagerConversation");
const Resource = require("../models/Resource");
const Feedback = require("../models/Feedback");
const User = require("../models/User");

const managerAuth = auth(["manager", "admin", "owner"]);

function haversineFilter(events, baseLat, baseLng, maxDistKm) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  return events
    .map((ev) => {
      const c = ev.location?.coordinates;
      if (!c || typeof c.lat !== "number" || typeof c.lng !== "number") return null;
      const dLat = toRad(c.lat - baseLat);
      const dLng = toRad(c.lng - baseLng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(baseLat)) * Math.cos(toRad(c.lat)) * Math.sin(dLng / 2) ** 2;
      const dist = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...ev, _distanceKm: dist };
    })
    .filter((ev) => ev && ev._distanceKm <= maxDistKm)
    .sort((a, b) => a._distanceKm - b._distanceKm);
}

// All assigned events with filters (date, type, location, status)
router.get("/events", managerAuth, async (req, res) => {
  try {
    const { dateFrom, dateTo, type, city, status } = req.query;
    const filter = { assignedManager: req.user.id };
    filter.status = status && ["pending", "accepted", "in_progress", "completed", "cancelled"].includes(status)
      ? status
      : { $in: ["accepted", "in_progress", "completed"] };
    if (type) filter.type = type;
    if (city) filter["location.city"] = new RegExp(city, "i");
    if (dateFrom || dateTo) {
      filter.scheduledAt = {};
      if (dateFrom) filter.scheduledAt.$gte = new Date(dateFrom);
      if (dateTo) filter.scheduledAt.$lte = new Date(dateTo);
    }
    const events = await Event.find(filter).populate("bookedBy", "name email phone").sort({ scheduledAt: 1 }).lean();
    return res.json(events);
  } catch (err) {
    console.error("Manager events error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Calendar view: events by month
router.get("/events/calendar", managerAuth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year, 10) || new Date().getFullYear();
    const m = parseInt(month, 10) - 1;
    if (Number.isNaN(m) || m < 0 || m > 11) return res.status(400).json({ message: "Invalid month" });
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);
    const events = await Event.find({
      assignedManager: req.user.id,
      scheduledAt: { $gte: start, $lte: end },
      status: { $ne: "cancelled" },
    })
      .select("title type scheduledAt status location")
      .sort({ scheduledAt: 1 })
      .lean();
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Nearby events (pending) for manager's location
router.get("/events/nearby", managerAuth, async (req, res) => {
  try {
    const { lat, lng, radiusKm } = req.query;
    const radius = Math.min(100, Math.max(5, parseInt(radiusKm, 10) || 20));
    let events = await Event.find({ status: "pending" }).populate("bookedBy", "name email").lean();
    if (lat && lng) {
      const baseLat = Number(lat);
      const baseLng = Number(lng);
      if (!Number.isNaN(baseLat) && !Number.isNaN(baseLng)) {
        events = haversineFilter(events, baseLat, baseLng, radius);
      }
    } else {
      events = events.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    }
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Assign team to event
router.post("/events/:id/team", managerAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.assignedManager) !== req.user.id) return res.status(403).json({ message: "Not your event" });
    const team = Array.isArray(req.body.team) ? req.body.team.map((t) => (typeof t === "string" ? t : t.name || "")).filter(Boolean) : [];
    event.assignedTeam = team;
    await event.save();
    return res.json(event);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Manager notifications
router.get("/notifications", managerAuth, async (req, res) => {
  try {
    const list = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Create reminder for an event (notification for manager)
router.post("/events/:id/remind", managerAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("bookedBy", "name");
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.assignedManager) !== req.user.id) return res.status(403).json({ message: "Not your event" });
    await Notification.create({
      user: req.user.id,
      type: "reminder",
      title: "Event reminder",
      body: `${event.title} – ${new Date(event.scheduledAt).toLocaleString()} at ${event.location?.city || ""}`,
      relatedEvent: event._id,
    });
    return res.json({ message: "Reminder set" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Conversations (chat with customer per event)
router.get("/conversations", managerAuth, async (req, res) => {
  try {
    const list = await ManagerConversation.find({ manager: req.user.id })
      .populate("event", "title scheduledAt status")
      .populate("user", "name email")
      .sort({ updatedAt: -1 })
      .lean();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/conversations/:id/messages", managerAuth, async (req, res) => {
  try {
    const conv = await ManagerConversation.findOne({ _id: req.params.id, manager: req.user.id }).lean();
    if (!conv) return res.status(404).json({ message: "Not found" });
    return res.json(conv.messages || []);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/conversations/:id/messages", managerAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) return res.status(400).json({ message: "Message required" });
    const conv = await ManagerConversation.findOne({ _id: req.params.id, manager: req.user.id });
    if (!conv) return res.status(404).json({ message: "Not found" });
    conv.messages.push({ from: "manager", text: String(text).trim() });
    await conv.save();
    return res.json(conv.messages);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Start or get conversation for an event
router.post("/conversations", managerAuth, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ message: "eventId required" });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.assignedManager) !== req.user.id) return res.status(403).json({ message: "Not your event" });
    let conv = await ManagerConversation.findOne({ event: eventId, manager: req.user.id }).populate("user", "name email");
    if (!conv) {
      conv = await ManagerConversation.create({
        event: eventId,
        user: event.bookedBy,
        manager: req.user.id,
        messages: [],
      });
      conv = await ManagerConversation.findById(conv._id).populate("user", "name email").populate("event", "title scheduledAt");
    }
    return res.json(conv);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Resources (inventory)
router.get("/resources", managerAuth, async (req, res) => {
  try {
    const list = await Resource.find({ manager: req.user.id }).lean();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/resources", managerAuth, async (req, res) => {
  try {
    const { name, type, quantity, unit, available } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });
    const resource = await Resource.create({
      manager: req.user.id,
      name: String(name).trim(),
      type: type || "other",
      quantity: Math.max(0, parseInt(quantity, 10) || 1),
      unit: unit || "pcs",
      available: available !== false,
    });
    return res.status(201).json(resource);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/resources/:id", managerAuth, async (req, res) => {
  try {
    const r = await Resource.findOneAndUpdate(
      { _id: req.params.id, manager: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!r) return res.status(404).json({ message: "Not found" });
    return res.json(r);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/resources/:id", managerAuth, async (req, res) => {
  try {
    const r = await Resource.findOneAndDelete({ _id: req.params.id, manager: req.user.id });
    if (!r) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Performance: completion rate and stats
router.get("/performance", managerAuth, async (req, res) => {
  try {
    const assigned = await Event.find({ assignedManager: req.user.id }).lean();
    const completed = assigned.filter((e) => e.status === "completed").length;
    const total = assigned.length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const byStatus = { pending: 0, accepted: 0, in_progress: 0, completed: 0, cancelled: 0 };
    assigned.forEach((e) => { byStatus[e.status] = (byStatus[e.status] || 0) + 1; });
    return res.json({ total, completed, completionRate, byStatus });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Feedback for manager's events
router.get("/feedback", managerAuth, async (req, res) => {
  try {
    const list = await Feedback.find({ manager: req.user.id })
      .populate("event", "title scheduledAt")
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Manager responds to a review
router.patch("/feedback/:id/reply", managerAuth, async (req, res) => {
  try {
    const { reply } = req.body;
    const feedback = await Feedback.findOne({ _id: req.params.id, manager: req.user.id });
    if (!feedback) return res.status(404).json({ message: "Not found" });
    feedback.managerReply = reply ? String(reply).trim() : "";
    feedback.managerRepliedAt = new Date();
    await feedback.save();
    return res.json(feedback);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Update manager location (for nearby / route optimization)
router.patch("/me/location", managerAuth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    if (!user.location) user.location = {};
    if (lat != null) user.location.coordinates = user.location.coordinates || {};
    if (lat != null) user.location.coordinates.lat = Number(lat);
    if (lng != null) user.location.coordinates.lng = Number(lng);
    await user.save();
    return res.json(user.location);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
