// models/requestModel.js

import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Food",
  },
  ngo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NGO",
  },
  status: {
    type: String,
    enum: ["requested", "accepted", "rejected", "completed"],
    default: "requested",
  },
  pickupTime: Date,
}, { timestamps: true });

export default mongoose.model("Request", requestSchema);