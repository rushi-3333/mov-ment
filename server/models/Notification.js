const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["booking_confirmation", "reminder", "update", "offer", "discount", "support_reply", "general", "emergency_alert"],
      default: "general",
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String },
    read: { type: Boolean, default: false },
    relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
