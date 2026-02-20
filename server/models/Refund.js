const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "processed", "rejected"],
      default: "pending",
    },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true }
);

refundSchema.index({ status: 1 });
refundSchema.index({ user: 1 });
module.exports = mongoose.model("Refund", refundSchema);
