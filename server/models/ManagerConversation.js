const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [
      {
        from: { type: String, enum: ["user", "manager"], required: true },
        text: { type: String, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

conversationSchema.index({ event: 1 });
conversationSchema.index({ manager: 1 });
module.exports = mongoose.model("ManagerConversation", conversationSchema);
