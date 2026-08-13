const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
    managerReply: { type: String, trim: true },
    managerRepliedAt: { type: Date },
    serviceRating: { type: Number, min: 1, max: 5 }, // optional per-service/vendor aggregate
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
