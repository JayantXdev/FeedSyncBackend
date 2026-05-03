const mongoose = require("mongoose");

const ngoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "NGO name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: 1,
    },
    currentLoad: {
      type: Number,
      default: 0,
    },
    contact: {
      type: String,
      required: [true, "Contact is required"],
    },
    email: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    totalFoodReceived: {
      type: Number,
      default: 0,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NGO", ngoSchema);