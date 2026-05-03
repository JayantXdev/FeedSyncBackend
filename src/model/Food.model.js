// models/foodModel.js

import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  title: String,
  quantity: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "picked", "delivered"],
    default: "pending",
  },
  aiSuggestion: String,
  expiryTime: Date,
}, { timestamps: true });

export default mongoose.model("Food", foodSchema);