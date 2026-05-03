const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
      required: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate ratings per request
ratingSchema.index({ user: 1, request: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);