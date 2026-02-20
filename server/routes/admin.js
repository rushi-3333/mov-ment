const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Event = require("../models/Event");
const ManagerConversation = require("../models/ManagerConversation");
const SupportTicket = require("../models/SupportTicket");
const Payment = require("../models/Payment");
const Refund = require("../models/Refund");
const Feedback = require("../models/Feedback");
const UserActivity = require("../models/UserActivity");
const Notification = require("../models/Notification");
const Promotion = require("../models/Promotion");
const ManagerRequest = require("../models/ManagerRequest");

// NOTE: We don't trust JWT role alone; we always check the DB.
// Owner = top role, admin = promoted manager.

async function requireAdminOrOwner(req, res) {
  try {
    const current = await User.findById(req.user.id).lean();
    if (!current) {
      console.warn("Admin check: user not found for id", req.user.id);
    } else {
      console.log("Admin check: current user", {
        id: String(current._id),
        email: current.email,
        role: current.role,
      });
    }
    if (!current || (current.role !== "admin" && current.role !== "owner")) {
      res.status(403).json({ message: "Forbidden" });
      return null;
    }
    return current;
  } catch (err) {
    console.error("Admin auth lookup error:", err);
    res.status(500).json({ message: "Server error" });
    return null;
  }
}

// All users
router.get("/users", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const users = await User.find().select("-passwordHash").lean();
    return res.json(users);
  } catch (err) {
    console.error("Admin users error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Only managers
router.get("/managers", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const managers = await User.find({ role: "manager" })
      .select("-passwordHash")
      .lean();
    return res.json(managers);
  } catch (err) {
    console.error("Admin managers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Pending managers (not yet approved)
router.get("/pending-managers", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const list = await User.find({ role: "manager", approved: { $ne: true } })
      .select("-passwordHash")
      .lean();
    return res.json(list);
  } catch (err) {
    console.error("Admin pending-managers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Approve a manager (admin or owner only)
router.post("/managers/:id/approve", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "manager") {
      return res.status(400).json({ message: "User is not a manager" });
    }
    user.approved = true;
    await user.save();
    return res.json({ message: "Manager approved", user: { id: user._id, name: user.name, email: user.email, approved: true } });
  } catch (err) {
    console.error("Approve manager error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Promote manager to admin (admin or owner only). Cannot modify owner.
router.post("/users/:id/promote-admin", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role === "owner") {
      return res.status(403).json({ message: "Cannot change the owner's role" });
    }
    if (target.role !== "manager") {
      return res.status(400).json({ message: "Only managers can be promoted to admin" });
    }
    target.role = "admin";
    await target.save();
    return res.json({ message: "Promoted to admin", user: { id: target._id, name: target.name, email: target.email, role: "admin" } });
  } catch (err) {
    console.error("Promote admin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Remove manager: demote to user (admin or owner only). Cannot modify owner.
router.post("/managers/:id/remove", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role === "owner") {
      return res.status(403).json({ message: "Cannot change the owner's role" });
    }
    if (target.role !== "manager") {
      return res.status(400).json({ message: "User is not a manager" });
    }
    target.role = "user";
    target.approved = false;
    await target.save();
    return res.json({ message: "Manager removed", user: { id: target._id, name: target.name, email: target.email, role: "user" } });
  } catch (err) {
    console.error("Remove manager error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Manager requests: list pending (users who asked to become manager)
router.get("/manager-requests", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { status } = req.query;
    const filter = status ? { status } : { status: "pending" };
    const list = await ManagerRequest.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(list);
  } catch (err) {
    console.error("Manager requests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Approve a manager request (user becomes manager)
router.post("/manager-requests/:id/approve", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const request = await ManagerRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Request already processed" });
    const target = await User.findById(request.user);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role !== "user") return res.status(400).json({ message: "User role has changed" });
    target.role = "manager";
    target.approved = true;
    await target.save();
    request.status = "approved";
    request.processedBy = current._id;
    request.processedAt = new Date();
    await request.save();
    return res.json({ message: "Manager request approved", user: { id: target._id, name: target.name, email: target.email, role: "manager", approved: true } });
  } catch (err) {
    console.error("Approve manager request error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Reject a manager request
router.post("/manager-requests/:id/reject", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const request = await ManagerRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Request already processed" });
    request.status = "rejected";
    request.processedBy = current._id;
    request.processedAt = new Date();
    await request.save();
    return res.json({ message: "Manager request rejected" });
  } catch (err) {
    console.error("Reject manager request error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// All events – summary only for admin (no full address, description, additionalServices, customRequests)
router.get("/events", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const events = await Event.find()
      .populate("bookedBy", "name email")
      .populate("assignedManager", "name email")
      .sort({ createdAt: -1 })
      .lean();
    const summary = events.map((ev) => ({
      _id: ev._id,
      type: ev.type,
      title: ev.title,
      status: ev.status,
      scheduledAt: ev.scheduledAt,
      location: ev.location ? { city: ev.location.city, pincode: ev.location.pincode } : {},
      bookedBy: ev.bookedBy ? { _id: ev.bookedBy._id, name: ev.bookedBy.name, email: ev.bookedBy.email } : null,
      assignedManager: ev.assignedManager ? { name: ev.assignedManager.name, email: ev.assignedManager.email } : null,
    }));
    return res.json(summary);
  } catch (err) {
    console.error("Admin events error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// All manager–customer conversations (admin oversight: view only)
router.get("/conversations", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const list = await ManagerConversation.find()
      .populate("event", "title scheduledAt status type")
      .populate("user", "name email")
      .populate("manager", "name email")
      .sort({ updatedAt: -1 })
      .lean();
    return res.json(list);
  } catch (err) {
    console.error("Admin conversations error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin: get messages for a conversation (read-only)
router.get("/conversations/:id/messages", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const conv = await ManagerConversation.findById(req.params.id).lean();
    if (!conv) return res.status(404).json({ message: "Not found" });
    return res.json(conv.messages || []);
  } catch (err) {
    console.error("Admin conversation messages error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ——— User Management: Complaints (support tickets) ———
router.get("/support-tickets", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { category, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    const list = await SupportTicket.find(filter)
      .populate("user", "name email")
      .populate("relatedEvent", "title scheduledAt status")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(list);
  } catch (err) {
    console.error("Admin support-tickets error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/support-tickets/:id", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { status, reply } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Not found" });
    if (status) ticket.status = status;
    if (reply) ticket.replies.push({ from: "support", message: String(reply) });
    await ticket.save();
    return res.json(ticket);
  } catch (err) {
    console.error("Admin support-ticket update error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ——— Refunds ———
router.get("/refunds", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { status } = req.query;
    const filter = status ? { status } : {};
    const list = await Refund.find(filter)
      .populate("user", "name email")
      .populate("event", "title scheduledAt status")
      .populate("processedBy", "name")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(list);
  } catch (err) {
    console.error("Admin refunds error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/refunds", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { eventId, userId, amount, reason } = req.body;
    if (!eventId || !userId || amount == null) return res.status(400).json({ message: "eventId, userId, amount required" });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const refund = await Refund.create({
      event: eventId,
      user: userId,
      amount: Number(amount),
      reason: reason || "",
      status: "pending",
    });
    return res.status(201).json(refund);
  } catch (err) {
    console.error("Admin create refund error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/refunds/:id", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { status, adminNote } = req.body;
    if (!["approved", "processed", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status" });
    const refund = await Refund.findById(req.params.id);
    if (!refund) return res.status(404).json({ message: "Not found" });
    refund.status = status;
    if (adminNote) refund.adminNote = adminNote;
    if (status === "processed" || status === "rejected") {
      refund.processedBy = current._id;
      refund.processedAt = new Date();
    }
    await refund.save();
    return res.json(refund);
  } catch (err) {
    console.error("Admin refund update error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ——— User activity ———
router.get("/user-activity", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { userId, action, limit } = req.query;
    const filter = {};
    if (userId) filter.user = userId;
    if (action) filter.action = action;
    const list = await UserActivity.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 100, 500))
      .lean();
    return res.json(list);
  } catch (err) {
    console.error("Admin user-activity error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ——— Event & Team: assign team to any event ———
router.post("/events/:id/assign-team", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const team = Array.isArray(req.body.team) ? req.body.team.map((t) => String(t).trim()).filter(Boolean) : [];
    event.assignedTeam = team;
    await event.save();
    return res.json(event);
  } catch (err) {
    console.error("Admin assign-team error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ——— Reports & Analytics ———
router.get("/analytics/dashboard", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const payments = await Payment.find({ status: "completed", createdAt: { $gte: startOfMonth } }).lean();
    const revenue = payments.reduce((s, p) => s + (p.amount - (p.refundedAmount || 0)), 0);
    const bookingsCount = await Event.countDocuments({ createdAt: { $gte: startOfMonth }, status: { $ne: "cancelled" } });
    const cancelledCount = await Event.countDocuments({ createdAt: { $gte: startOfMonth }, status: "cancelled" });
    const feedbacks = await Feedback.find({ createdAt: { $gte: startOfMonth } }).lean();
    const avgRating = feedbacks.length ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length : 0;
    const byStatus = await Event.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const byType = await Event.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: "$type", count: { $sum: 1 } } }]);
    const highDemandDates = await Event.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$scheduledAt" } }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    return res.json({
      revenue: Math.round(revenue * 100) / 100,
      bookingsCount,
      cancelledCount,
      avgRating: Math.round(avgRating * 100) / 100,
      feedbackCount: feedbacks.length,
      byStatus: byStatus.reduce((o, x) => ({ ...o, [x._id]: x.count }), {}),
      byType: byType.reduce((o, x) => ({ ...o, [x._id]: x.count }), {}),
      highDemandDates,
      period: "month",
    });
  } catch (err) {
    console.error("Admin analytics dashboard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/analytics/reports", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { period } = req.query; // week | month
    const now = new Date();
    let start;
    if (period === "week") {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const payments = await Payment.find({ status: "completed", createdAt: { $gte: start } }).lean();
    const revenue = payments.reduce((s, p) => s + (p.amount - (p.refundedAmount || 0)), 0);
    const bookings = await Event.countDocuments({ createdAt: { $gte: start }, status: { $ne: "cancelled" } });
    const cancelled = await Event.countDocuments({ createdAt: { $gte: start }, status: "cancelled" });
    const feedbacks = await Feedback.find({ createdAt: { $gte: start } }).lean();
    const avgRating = feedbacks.length ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length : 0;
    return res.json({
      period: period || "month",
      start,
      end: now,
      revenue: Math.round(revenue * 100) / 100,
      bookings,
      cancelled,
      feedbackCount: feedbacks.length,
      avgRating: Math.round(avgRating * 100) / 100,
    });
  } catch (err) {
    console.error("Admin reports error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/analytics/manager-performance", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const managers = await User.find({ role: "manager" }).select("name email").lean();
    const eventsByManager = await Event.aggregate([
      { $match: { assignedManager: { $exists: true, $ne: null } } },
      { $group: { _id: "$assignedManager", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
    ]);
    const feedbackByManager = await Feedback.aggregate([{ $group: { _id: "$manager", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }]);
    const map = {};
    managers.forEach((m) => {
      map[m._id.toString()] = { ...m, totalEvents: 0, completedEvents: 0, completionRate: 0, avgRating: 0, feedbackCount: 0 };
    });
    eventsByManager.forEach((x) => {
      const id = x._id.toString();
      if (map[id]) {
        map[id].totalEvents = x.total;
        map[id].completedEvents = x.completed;
        map[id].completionRate = x.total ? Math.round((x.completed / x.total) * 100) : 0;
      }
    });
    feedbackByManager.forEach((x) => {
      const id = x._id.toString();
      if (map[id]) {
        map[id].avgRating = Math.round(x.avgRating * 100) / 100;
        map[id].feedbackCount = x.count;
      }
    });
    return res.json(Object.values(map));
  } catch (err) {
    console.error("Admin manager-performance error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/analytics/load", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const upcoming = await Event.find({ status: { $in: ["pending", "accepted", "in_progress"] }, scheduledAt: { $gte: new Date() } })
      .populate("assignedManager", "name email")
      .lean();
    const byManager = {};
    upcoming.forEach((ev) => {
      const id = ev.assignedManager ? ev.assignedManager._id.toString() : "unassigned";
      if (!byManager[id]) byManager[id] = { manager: ev.assignedManager || { name: "Unassigned" }, count: 0, events: [] };
      byManager[id].count += 1;
      byManager[id].events.push({ _id: ev._id, title: ev.title, scheduledAt: ev.scheduledAt });
    });
    const pendingCount = await Event.countDocuments({ status: "pending" });
    return res.json({ byManager: Object.values(byManager), pendingCount, totalUpcoming: upcoming.length });
  } catch (err) {
    console.error("Admin load error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ——— Notifications & Alerts ———
router.post("/notifications/send", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { userIds, managerIds, broadcast, title, body, type, relatedEventId } = req.body;
    if (!title) return res.status(400).json({ message: "title required" });
    const typeVal = type || "general";
    const targetUserIds = new Set();
    if (broadcast) {
      const users = await User.find().select("_id").lean();
      users.forEach((u) => targetUserIds.add(u._id.toString()));
    }
    if (Array.isArray(userIds)) userIds.forEach((id) => targetUserIds.add(String(id)));
    if (Array.isArray(managerIds)) {
      const managers = await User.find({ _id: { $in: managerIds }, role: "manager" }).select("_id").lean();
      managers.forEach((m) => targetUserIds.add(m._id.toString()));
    }
    const created = [];
    for (const uid of targetUserIds) {
      const n = await Notification.create({
        user: uid,
        type: typeVal,
        title: String(title).trim(),
        body: body ? String(body).trim() : "",
        relatedEvent: relatedEventId || undefined,
      });
      created.push(n);
    }
    return res.json({ message: `Sent to ${created.length} user(s)`, count: created.length });
  } catch (err) {
    console.error("Admin send notification error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ——— Promotions & Offers ———
router.get("/promotions", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const list = await Promotion.find().sort({ createdAt: -1 }).lean();
    return res.json(list);
  } catch (err) {
    console.error("Admin promotions list error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/promotions", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { code, type, value, minOrderAmount, validFrom, validTo, eventType, maxUses } = req.body;
    if (!code || !validFrom || !validTo) return res.status(400).json({ message: "code, validFrom, validTo required" });
    const existing = await Promotion.findOne({ code: String(code).trim().toUpperCase() });
    if (existing) return res.status(400).json({ message: "Code already exists" });
    const prom = await Promotion.create({
      code: String(code).trim().toUpperCase(),
      type: type || "percent",
      value: Number(value) || 0,
      minOrderAmount: Number(minOrderAmount) || 0,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      eventType: eventType || undefined,
      maxUses: maxUses ? Number(maxUses) : null,
      createdBy: current._id,
    });
    return res.status(201).json(prom);
  } catch (err) {
    console.error("Admin create promotion error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/promotions/:id", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const { active, validFrom, validTo, maxUses } = req.body;
    const prom = await Promotion.findById(req.params.id);
    if (!prom) return res.status(404).json({ message: "Not found" });
    if (typeof active === "boolean") prom.active = active;
    if (validFrom) prom.validFrom = new Date(validFrom);
    if (validTo) prom.validTo = new Date(validTo);
    if (maxUses != null) prom.maxUses = maxUses;
    await prom.save();
    return res.json(prom);
  } catch (err) {
    console.error("Admin update promotion error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/promotions/:id", auth(), async (req, res) => {
  try {
    const current = await requireAdminOrOwner(req, res);
    if (!current) return;
    const prom = await Promotion.findByIdAndDelete(req.params.id);
    if (!prom) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Admin delete promotion error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

