// models/ratingModel.js

import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  ngo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NGO",
  },
  rating: Number,
  feedback: String,
}, { timestamps: true });

export default mongoose.model("Rating", ratingSchema);