const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: ["percent", "fixed"], default: "percent" },
    value: { type: Number, required: true, min: 0 }, // percent 1-100 or fixed amount
    minOrderAmount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    eventType: { type: String, trim: true }, // optional: only for this event type
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

promotionSchema.index({ code: 1 });
promotionSchema.index({ validFrom: 1, validTo: 1 });
module.exports = mongoose.model("Promotion", promotionSchema);
