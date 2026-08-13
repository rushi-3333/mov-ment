const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [
      {
        questionId: { type: String, required: true },
        question: { type: String },
        value: { type: mongoose.Schema.Types.Mixed }, // number, string, or array for multi-choice
      },
    ],
  },
  { timestamps: true }
);

surveySchema.index({ event: 1, user: 1 }, { unique: true });
module.exports = mongoose.model("Survey", surveySchema);
