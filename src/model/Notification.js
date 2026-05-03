const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "food_posted",
        "request_received",
        "request_accepted",
        "request_rejected",
        "food_picked",
        "food_delivered",
        "expiry_alert",
        "new_rating",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedFood: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);