const router = require("express").Router();
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");
const SupportTicket = require("../models/SupportTicket");
const Payment = require("../models/Payment");
const Event = require("../models/Event");
const Feedback = require("../models/Feedback");
const ManagerConversation = require("../models/ManagerConversation");
const Survey = require("../models/Survey");
const ManagerRequest = require("../models/ManagerRequest");
const User = require("../models/User");
const { generateInvoicePdf } = require("../utils/invoicePdf");

// Request to become a manager (user asks admin to grant manager role)
router.post("/request-manager", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "manager" || user.role === "admin" || user.role === "owner") {
      return res.status(400).json({ message: "You already have a manager or higher role" });
    }
    const existing = await ManagerRequest.findOne({ user: req.user.id, status: "pending" });
    if (existing) return res.status(400).json({ message: "You already have a pending manager request" });
    const request = await ManagerRequest.create({ user: req.user.id, status: "pending" });
    return res.status(201).json({ message: "Request sent. Admin will review it.", request: { _id: request._id, status: request.status } });
  } catch (err) {
    console.error("Request manager error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/manager-request", auth(), async (req, res) => {
  try {
    const request = await ManagerRequest.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json(request || null);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Profile – get/update for any logged-in user (user, manager, admin, owner)
router.get("/profile", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-passwordHash -twoFactorSecret -googleId -facebookId")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("Profile get error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/profile", auth(), async (req, res) => {
  try {
    const { name, phone, profilePicture, location } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (name !== undefined) user.name = String(name).trim() || user.name;
    if (phone !== undefined) user.phone = String(phone).trim();
    if (profilePicture !== undefined) user.profilePicture = String(profilePicture).trim();
    if (location && typeof location === "object") {
      if (location.city !== undefined) user.location = user.location || {};
      if (location.city !== undefined) user.location.city = String(location.city).trim();
      if (location.area !== undefined) user.location.area = String(location.area).trim();
      if (location.addressLine !== undefined) user.location.addressLine = String(location.addressLine).trim();
    }
    await user.save();
    const out = await User.findById(user._id).select("-passwordHash -twoFactorSecret -googleId -facebookId").lean();
    return res.json(out);
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Notifications – list and mark read
router.get("/notifications", auth(), async (req, res) => {
  try {
    const list = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json(list);
  } catch (err) {
    console.error("Notifications error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/notifications/:id/read", auth(), async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: "Not found" });
    return res.json(n);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/notifications/read-all", auth(), async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id }, { read: true });
    return res.json({ message: "All marked as read" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Support – create ticket, list, get one, add reply
router.post("/support", auth(), async (req, res) => {
  try {
    const { subject, message, category, relatedEventId } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message required" });
    }
    const ticket = await SupportTicket.create({
      user: req.user.id,
      subject,
      message,
      category: category || "query",
      relatedEvent: relatedEventId || undefined,
    });
    return res.status(201).json(ticket);
  } catch (err) {
    console.error("Support ticket error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/support", auth(), async (req, res) => {
  try {
    const list = await SupportTicket.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/support/:id", auth(), async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).lean();
    if (!ticket) return res.status(404).json({ message: "Not found" });
    return res.json(ticket);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/support/:id/reply", auth(), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message required" });
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!ticket) return res.status(404).json({ message: "Not found" });
    ticket.replies.push({ from: "user", message });
    await ticket.save();
    return res.json(ticket);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Payments – create (stub), list, get receipt
router.post("/payments", auth(), async (req, res) => {
  try {
    const { eventId, amount, method } = req.body;
    if (!eventId || amount == null) {
      return res.status(400).json({ message: "Event and amount required" });
    }
    const event = await Event.findOne({ _id: eventId, bookedBy: req.user.id });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const payment = await Payment.create({
      user: req.user.id,
      event: eventId,
      amount: Number(amount),
      method: method || "other",
      status: "completed",
      externalId: `stub_${Date.now()}`,
      receiptUrl: `/api/user/invoice/${eventId}?format=receipt`,
    });
    return res.status(201).json({
      ...payment.toObject(),
      message: "Payment recorded. Receipt available in booking history.",
    });
  } catch (err) {
    console.error("Payment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/payments", auth(), async (req, res) => {
  try {
    const list = await Payment.find({ user: req.user.id })
      .populate("event", "title type scheduledAt status")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Invoice: PDF download (format=pdf) or JSON
router.get("/invoice/:eventId", auth(), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate("bookedBy", "name email phone")
      .populate("assignedManager", "name email")
      .lean();
    if (!event) return res.status(404).json({ message: "Event not found" });
    const bookedById = event.bookedBy && (event.bookedBy._id || event.bookedBy);
    if (String(bookedById) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (req.query.format === "pdf") {
      const invoiceNumber = "INV-" + String(event._id).slice(-8).toUpperCase();
      const pdfBuffer = await generateInvoicePdf(event, invoiceNumber);
      if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
        return res.status(500).json({ message: "Failed to generate PDF" });
      }
      const filename = "invoice-" + String(req.params.eventId).replace(/[^a-zA-Z0-9-_]/g, "") + ".pdf";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="' + filename + '"');
      res.setHeader("Content-Length", pdfBuffer.length);
      return res.send(pdfBuffer);
    }
    return res.json({
      type: "invoice",
      eventId: event._id,
      title: event.title,
      eventType: event.type,
      scheduledAt: event.scheduledAt,
      guestCount: event.guestCount,
      venue: event.venue,
      location: event.location,
      additionalServices: event.additionalServices,
      bookedBy: event.bookedBy,
      assignedManager: event.assignedManager,
      status: event.status,
      createdAt: event.createdAt,
    });
  } catch (err) {
    console.error("Invoice error:", err);
    return res.status(500).json({ message: req.query.format === "pdf" ? "Failed to generate invoice PDF" : "Server error" });
  }
});

// Submit feedback for a completed event (customer)
router.post("/events/:eventId/feedback", auth(), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (rating == null || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating 1–5 required" });
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.bookedBy) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    if (event.status !== "completed") return res.status(400).json({ message: "Feedback only for completed events" });
    if (!event.assignedManager) return res.status(400).json({ message: "No manager assigned" });
    const existing = await Feedback.findOne({ event: event._id, user: req.user.id });
    if (existing) return res.status(400).json({ message: "You already submitted feedback for this event" });
    const feedback = await Feedback.create({
      event: event._id,
      user: req.user.id,
      manager: event.assignedManager,
      rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
      comment: comment ? String(comment).trim() : undefined,
    });
    return res.status(201).json(feedback);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Post-event survey: get questions (static)
router.get("/survey/questions", auth(), (req, res) => {
  const questions = [
    { id: "overall", question: "How would you rate your overall experience?", type: "rating", min: 1, max: 5 },
    { id: "would_recommend", question: "Would you recommend us to a friend?", type: "rating", min: 1, max: 5 },
    { id: "improvement", question: "What could we improve? (optional)", type: "text" },
  ];
  return res.json(questions);
});

// Submit post-event survey
router.post("/events/:eventId/survey", auth(), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.bookedBy) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    if (event.status !== "completed") return res.status(400).json({ message: "Survey only for completed events" });
    const existing = await Survey.findOne({ event: event._id, user: req.user.id });
    if (existing) return res.status(400).json({ message: "You already submitted the survey for this event" });
    const { answers } = req.body;
    if (!Array.isArray(answers) || !answers.length) return res.status(400).json({ message: "Answers required" });
    const survey = await Survey.create({
      event: event._id,
      user: req.user.id,
      answers: answers.map((a) => ({ questionId: a.questionId, question: a.question, value: a.value })),
    });
    return res.status(201).json(survey);
  } catch (err) {
    console.error("Survey submit error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Manager–customer chat: list conversations where I am the customer
router.get("/conversations", auth(), async (req, res) => {
  try {
    const list = await ManagerConversation.find({ user: req.user.id })
      .populate("event", "title scheduledAt status")
      .populate("manager", "name email")
      .sort({ updatedAt: -1 })
      .lean();
    return res.json(list);
  } catch (err) {
    console.error("User conversations error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get or create conversation for an event (customer). Conversation exists once manager has started chat or we create when event has assigned manager.
router.get("/conversations/for-event/:eventId", auth(), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).lean();
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.bookedBy) !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    let conv = await ManagerConversation.findOne({ event: req.params.eventId, user: req.user.id })
      .populate("event", "title scheduledAt status")
      .populate("manager", "name email")
      .lean();
    if (!conv && event.assignedManager) {
      const created = await ManagerConversation.create({
        event: req.params.eventId,
        user: req.user.id,
        manager: event.assignedManager,
        messages: [],
      });
      conv = await ManagerConversation.findById(created._id)
        .populate("event", "title scheduledAt status")
        .populate("manager", "name email")
        .lean();
    }
    if (!conv) return res.status(404).json({ message: "No conversation for this event yet. A manager will start the chat once assigned." });
    return res.json(conv);
  } catch (err) {
    console.error("User conversation for event error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get messages for a conversation (customer must be the user)
router.get("/conversations/:id/messages", auth(), async (req, res) => {
  try {
    const conv = await ManagerConversation.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!conv) return res.status(404).json({ message: "Not found" });
    return res.json(conv.messages || []);
  } catch (err) {
    console.error("User conversation messages error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Customer sends a message to manager
router.post("/conversations/:id/messages", auth(), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) return res.status(400).json({ message: "Message required" });
    const conv = await ManagerConversation.findOne({ _id: req.params.id, user: req.user.id });
    if (!conv) return res.status(404).json({ message: "Not found" });
    conv.messages.push({ from: "user", text: String(text).trim() });
    await conv.save();
    return res.json(conv.messages);
  } catch (err) {
    console.error("User send message error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// FAQ (static – can be replaced with AI later)
router.get("/faq", (req, res) => {
  const faq = [
    { q: "How do I book an event?", a: "Log in, go to Create event booking, fill in type, date, venue, and optional services. Submit to create a booking." },
    { q: "Can I cancel or reschedule?", a: "Yes. From My events you can cancel or reschedule events that are still pending or accepted." },
    { q: "How do I get a receipt?", a: "Open the event in your booking history and use the Download invoice option." },
    { q: "What payment methods are accepted?", a: "We accept card, UPI, wallets, and net banking. Split payment can be arranged for group events." },
    { q: "How do I contact support?", a: "Use the Support section to raise a query or complaint. We respond within 24 hours." },
  ];
  return res.json(faq);
});

module.exports = router;
