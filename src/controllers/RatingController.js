const Rating = require("../models/Rating");
const NGO = require("../models/NGO");
const Request = require("../models/Request");

// @route   POST /api/ratings
// @desc    Rate an NGO after completed delivery
// @access  Private (donor)
const createRating = async (req, res) => {
  try {
    const { ngoId, requestId, rating, feedback } = req.body;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: "Request not found." });
    if (request.status !== "completed") {
      return res.status(400).json({ success: false, message: "Can only rate after delivery is completed." });
    }
    if (request.isRated) {
      return res.status(400).json({ success: false, message: "Already rated this request." });
    }

    const newRating = await Rating.create({
      user: req.user._id,
      ngo: ngoId,
      request: requestId,
      rating,
      feedback,
    });

    // Update NGO average rating
    const allRatings = await Rating.find({ ngo: ngoId });
    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await NGO.findByIdAndUpdate(ngoId, {
      rating: Math.round(avgRating * 10) / 10,
      totalRatings: allRatings.length,
    });

    // Mark request as rated
    await Request.findByIdAndUpdate(requestId, { isRated: true });

    res.status(201).json({ success: true, message: "Rating submitted!", rating: newRating });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already rated this." });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/ratings/ngo/:ngoId
// @desc    Get ratings for an NGO
// @access  Public
const getNGORatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ ngo: req.params.ngoId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: ratings.length, ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/ratings/my
// @desc    Get my given ratings
// @access  Private
const getMyRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ user: req.user._id })
      .populate("ngo", "name location")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: ratings.length, ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createRating, getNGORatings, getMyRatings };