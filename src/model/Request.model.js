const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "rejected", "picked", "completed"],
      default: "requested",
    },
    pickupTime: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    note: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    qrCode: {
      type: String, // store QR token for verification
      default: "",
    },
    isRated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);