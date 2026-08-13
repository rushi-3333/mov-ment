const mongoose = require("mongoose");

const managerRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    message: { type: String, trim: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

managerRequestSchema.index({ user: 1 });
managerRequestSchema.index({ status: 1 });
module.exports = mongoose.model("ManagerRequest", managerRequestSchema);
