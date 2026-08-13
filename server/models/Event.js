const mongoose = require("mongoose");

const EVENT_TYPES = ["birthday", "surprise", "anniversary", "farewell", "software_launch", "corporate", "other"];
const ADDITIONAL_SERVICES = ["decoration", "food", "equipment", "photography", "music_dj", "catering", "venue_setup"];

const eventSchema = new mongoose.Schema(
  {
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedTeam: [{ type: String, trim: true }],
    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    guestCount: {
      type: Number,
      min: 1,
      default: 1,
    },
    venue: {
      type: String,
      trim: true,
    },
    location: {
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: { type: String },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      mapLink: { type: String, trim: true }, // exact location from Google Maps (share link)
    },
    // Each item: { service, description?, image? } for customization; or legacy array of strings
    additionalServices: [{
      service: { type: String },
      description: { type: String, default: "" },
      image: { type: String },
    }],
    customRequests: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    autoAssignDeadline: { type: Date },
    reminderSentAt: { type: Date },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
        },
        at: { type: Date, default: Date.now },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  { timestamps: true }
);

eventSchema.statics.eventTypes = EVENT_TYPES;
eventSchema.statics.additionalServices = ADDITIONAL_SERVICES;
module.exports = mongoose.model("Event", eventSchema);

