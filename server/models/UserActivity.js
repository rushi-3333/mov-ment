const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["login", "logout", "booking_created", "booking_cancelled", "booking_rescheduled", "payment", "feedback", "support_ticket", "chat_message", "profile_update"],
      required: true,
    },
    entityType: { type: String, trim: true }, // Event, Payment, SupportTicket, etc.
    entityId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true }
);

userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ action: 1, createdAt: -1 });
module.exports = mongoose.model("UserActivity", userActivitySchema);
