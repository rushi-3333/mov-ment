const mongoose = require("mongoose");

const EVENT_TYPES = ["birthday", "surprise", "anniversary", "farewell", "software_launch", "corporate", "other"];

const managerPortfolioEventSchema = new mongoose.Schema(
  {
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
      default: "",
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    venue: {
      type: String,
      trim: true,
    },
    guestCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManagerPortfolioEvent", managerPortfolioEventSchema);
