const Event = require("../models/Event");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Simple auto-assign: for each pending event past its deadline,
// find any manager in the same city and assign it.
async function runAutoAssignOnce() {
  const now = new Date();

  // Find events that are still pending but past their autoAssignDeadline
  const events = await Event.find({
    status: "pending",
    autoAssignDeadline: { $lte: now },
  });

  if (!events.length) return;

  for (const event of events) {
    try {
      const city = event.location?.city;
      const managerQuery = { role: "manager" };
      if (city) {
        managerQuery["location.city"] = city;
      }

      const manager = await User.findOne(managerQuery);
      if (!manager) {
        // No manager available; skip for now.
        continue;
      }

      event.assignedManager = manager._id;
      event.status = "accepted";
      await event.save();
    } catch (err) {
      // Log and continue with other events
      console.error("Auto-assign error for event", event._id, err.message);
    }
  }
}

// Automated reminders: events in the next 24h get a reminder notification (once per event)
async function runRemindersOnce() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const events = await Event.find({
    status: { $in: ["accepted", "in_progress"] },
    scheduledAt: { $gte: now, $lte: in24h },
    reminderSentAt: { $exists: false },
  });
  for (const event of events) {
    try {
      await Notification.create({
        user: event.bookedBy,
        type: "reminder",
        title: "Event reminder",
        body: `Your event "${event.title}" is scheduled for ${new Date(event.scheduledAt).toLocaleString()}.`,
        relatedEvent: event._id,
      });
      event.reminderSentAt = new Date();
      await event.save();
    } catch (err) {
      console.error("Reminder error for event", event._id, err.message);
    }
  }
}

function startAutoAssignScheduler() {
  const intervalMs = 60 * 1000;
  setInterval(() => {
    runAutoAssignOnce().catch((err) =>
      console.error("Auto-assign scheduler error:", err.message)
    );
  }, intervalMs);
  // Automated reminders every 6 hours
  const reminderIntervalMs = 6 * 60 * 60 * 1000;
  setInterval(() => {
    runRemindersOnce().catch((err) =>
      console.error("Reminder scheduler error:", err.message)
    );
  }, reminderIntervalMs);
}

module.exports = {
  startAutoAssignScheduler,
};

