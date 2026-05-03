// models/userModel.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["donor", "ngo", "admin"],
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  trustScore: {
    type: Number,
    default: 5, // out of 10
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);