const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "manager", "admin", "owner"],
      default: "user",
    },
    approved: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      city: String,
      area: String,
      addressLine: String,
      coordinates: { lat: Number, lng: Number },
    },
    // Social login (optional – for future OAuth)
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true },
    // Two-factor authentication
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String }, // TOTP secret (encrypted in production)
    // Preferences for recommendations
    preferences: {
      preferredEventTypes: [String],
      preferredCity: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

