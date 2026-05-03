const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Food title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 1,
    },
    quantityUnit: {
      type: String,
      enum: ["kg", "plates", "litres", "boxes", "packets", "servings"],
      default: "kg",
    },
    foodType: {
      type: String,
      enum: ["veg", "non-veg", "both"],
      default: "veg",
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "picked", "delivered", "expired"],
      default: "pending",
    },
    aiSuggestion: {
      type: String,
      default: "",
    },
    expiryTime: {
      type: Date,
      required: [true, "Expiry time is required"],
    },
    images: [{ type: String }],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    carbonSaved: {
      type: Number,
      default: 0, // in kg CO2 equivalent
    },
  },
  { timestamps: true }
);

// Auto-expire food
foodSchema.index({ expiryTime: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Food", foodSchema);