const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["decoration", "equipment", "catering", "other"],
      default: "other",
    },
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: "pcs", trim: true },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
