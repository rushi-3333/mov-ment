const router = require("express").Router();
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const UserActivity = require("../models/UserActivity");
const Feedback = require("../models/Feedback");
const auth = require("../middleware/auth");

// User creates an event booking
router.post("/", auth(["user", "admin", "owner"]), async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      scheduledAt,
      addressLine,
      city,
      pincode,
      landmark,
      lat,
      lng,
      mapLink,
      guestCount,
      venue,
      additionalServices,
      customRequests,
    } = req.body;

    if (!type || !title || !scheduledAt || !addressLine || !city || !pincode) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    const autoAssignDeadline = new Date(now.getTime() + 15 * 60 * 1000);

    const event = await Event.create({
      bookedBy: req.user.id,
      type,
      title,
      description,
      scheduledAt: scheduledDate,
      guestCount: Math.max(1, parseInt(guestCount, 10) || 1),
      venue: venue ? String(venue).trim() : undefined,
      additionalServices: Array.isArray(additionalServices)
        ? additionalServices.map((s) =>
            typeof s === "string"
              ? { service: s, description: "", image: "" }
              : { service: s.service || "", description: s.description || "", image: s.image || "" }
          ).filter((s) => s.service)
        : [],
      customRequests: customRequests ? String(customRequests).trim() : undefined,
      location: {
        addressLine,
        city,
        pincode,
        landmark,
        coordinates:
          lat && lng
            ? { lat: Number(lat) || undefined, lng: Number(lng) || undefined }
            : undefined,
        mapLink: mapLink && String(mapLink).trim() ? String(mapLink).trim() : undefined,
      },
      autoAssignDeadline,
      statusHistory: [{ status: "pending", by: req.user.id }],
    });

    await Notification.create({
      user: req.user.id,
      type: "booking_confirmation",
      title: "Booking confirmed",
      body: `Your event "${event.title}" is scheduled for ${scheduledDate.toLocaleString()}.`,
      relatedEvent: event._id,
    });

    return res.status(201).json(event);
  } catch (err) {
    console.error("Create event error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Event types and additional services (for forms and package suggestions)
router.get("/meta", (req, res) => {
  try {
    const EventModel = require("../models/Event");
    return res.json({
      eventTypes: EventModel.eventTypes || ["birthday", "surprise", "anniversary", "farewell", "software_launch", "corporate", "other"],
      additionalServices: EventModel.additionalServices || ["decoration", "food", "equipment", "photography", "music_dj", "catering", "venue_setup"],
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Package suggestions with AI-style recommendations: themes, venues, staffing
router.get("/suggestions", auth(["user", "admin", "owner"]), async (req, res) => {
  try {
    const { guestCount } = req.query;
    const guests = Math.max(1, parseInt(guestCount, 10) || 10);
    const suggestedStaffing = guests <= 20 ? { min: 1, max: 2 } : guests <= 50 ? { min: 2, max: 4 } : { min: 3, max: 6 };
    const suggestions = [
      { type: "birthday", services: ["decoration", "food", "music_dj"], label: "Classic Birthday Package", theme: "Balloons & cake", venueType: "Indoor/outdoor" },
      { type: "farewell", services: ["decoration", "food", "photography"], label: "Farewell Party Package", theme: "Memories & send-off", venueType: "Hall" },
      { type: "software_launch", services: ["venue_setup", "equipment", "catering"], label: "Product Launch Package", theme: "Professional demo", venueType: "Conference / auditorium" },
      { type: "anniversary", services: ["decoration", "photography", "food"], label: "Anniversary Celebration", theme: "Elegant & romantic", venueType: "Banquet hall" },
      { type: "corporate", services: ["venue_setup", "equipment", "catering"], label: "Corporate Event", theme: "Business formal", venueType: "Hotel / conference" },
    ];
    return res.json({ suggestions, suggestedStaffing, venueTypes: ["Indoor hall", "Outdoor garden", "Hotel ballroom", "Conference room", "Rooftop", "Community center"] });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Aggregate ratings for services/managers (for display)
router.get("/ratings/aggregate", (req, res) => {
  Feedback.aggregate([
    { $group: { _id: "$manager", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    { $sort: { avgRating: -1 } },
    { $limit: 50 },
  ])
    .then((r) => res.json(r))
    .catch((err) => {
      console.error("Ratings aggregate error:", err);
      res.status(500).json({ message: "Server error" });
    });
});

// User: list own events
router.get("/my", auth(["user", "manager", "admin", "owner"]), async (req, res) => {
  try {
    const events = await Event.find({ bookedBy: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(events);
  } catch (err) {
    console.error("List my events error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Manager: list pending events (simple city-based filter for now)
router.get(
  "/pending",
  auth(["manager", "admin", "owner"]),
  async (req, res) => {
    try {
      const { city, lat, lng, radiusKm } = req.query;

      const filter = { status: "pending" };
      if (city) {
        filter["location.city"] = city;
      }

      let events = await Event.find(filter).lean();

      // If coordinates are provided, filter by distance (simple Haversine)
      if (lat && lng && radiusKm) {
        const toRad = (v) => (v * Math.PI) / 180;
        const R = 6371; // km
        const baseLat = Number(lat);
        const baseLng = Number(lng);
        const maxDist = Number(radiusKm);

        events = events
          .map((ev) => {
            const c = ev.location?.coordinates;
            if (!c || typeof c.lat !== "number" || typeof c.lng !== "number") {
              return null;
            }
            const dLat = toRad(c.lat - baseLat);
            const dLng = toRad(c.lng - baseLng);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(baseLat)) *
                Math.cos(toRad(c.lat)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            const dist = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return { ...ev, _distanceKm: dist };
          })
          .filter((ev) => ev && ev._distanceKm <= maxDist)
          .sort((a, b) => a._distanceKm - b._distanceKm);
      } else {
        events = events.sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime()
        );
      }

      return res.json(events);
    } catch (err) {
      console.error("List pending events error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Manager: accept an event
router.post(
  "/:id/accept",
  auth(["manager", "admin", "owner"]),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (event.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Event is not in pending status" });
      }

      event.status = "accepted";
      event.assignedManager = req.user.id;
      event.statusHistory.push({
        status: "accepted",
        by: req.user.id,
      });
      await event.save();

      return res.json(event);
    } catch (err) {
      console.error("Accept event error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Manager/Admin: view events assigned to me (active)
router.get(
  "/assigned",
  auth(["manager", "admin", "owner"]),
  async (req, res) => {
    try {
      const events = await Event.find({
        assignedManager: req.user.id,
        status: { $in: ["accepted", "in_progress"] },
      })
        .sort({ scheduledAt: 1 })
        .lean();
      return res.json(events);
    } catch (err) {
      console.error("List assigned events error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// User: cancel own event (only if pending or accepted and policy allows)
router.post("/:id/cancel", auth(["user", "admin", "owner"]), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.bookedBy) !== req.user.id) {
      return res.status(403).json({ message: "You can only cancel your own events" });
    }
    if (!["pending", "accepted"].includes(event.status)) {
      return res.status(400).json({ message: "Event cannot be cancelled in current status" });
    }
    event.status = "cancelled";
    event.statusHistory.push({ status: "cancelled", by: req.user.id });
    await event.save();
    UserActivity.create({ user: req.user.id, action: "booking_cancelled", entityType: "Event", entityId: event._id }).catch(() => {});
    return res.json(event);
  } catch (err) {
    console.error("Cancel event error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// User: reschedule own event (only pending or accepted)
router.post("/:id/reschedule", auth(["user", "admin", "owner"]), async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    if (!scheduledAt) return res.status(400).json({ message: "New date/time required" });
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.bookedBy) !== req.user.id) {
      return res.status(403).json({ message: "You can only reschedule your own events" });
    }
    if (!["pending", "accepted"].includes(event.status)) {
      return res.status(400).json({ message: "Event cannot be rescheduled in current status" });
    }
    event.scheduledAt = new Date(scheduledAt);
    await event.save();
    UserActivity.create({ user: req.user.id, action: "booking_rescheduled", entityType: "Event", entityId: event._id }).catch(() => {});
    return res.json(event);
  } catch (err) {
    console.error("Reschedule event error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Manager/Admin: update status (e.g. in_progress, completed, cancelled)
router.post(
  "/:id/status",
  auth(["manager", "admin", "owner"]),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (
        !["in_progress", "completed", "cancelled"].includes(status)
      ) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      event.status = status;
      event.statusHistory.push({
        status,
        by: req.user.id,
      });
      await event.save();

      return res.json(event);
    } catch (err) {
      console.error("Update status error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;

