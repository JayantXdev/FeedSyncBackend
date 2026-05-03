const Food = require("../models/Food");
const User = require("../models/User");
const Notification = require("../models/Notification");

// AI suggestion based on food type and expiry (simple rule-based for college project)
const generateAISuggestion = (title, expiryTime, quantity, foodType) => {
  const hoursLeft = Math.floor((new Date(expiryTime) - new Date()) / (1000 * 60 * 60));

  if (hoursLeft <= 2) {
    return `⚠️ URGENT: Only ${hoursLeft} hour(s) left! Immediately contact nearest NGO for pickup.`;
  } else if (hoursLeft <= 6) {
    return `🔔 ${title} expires in ${hoursLeft} hours. Prioritize NGOs within 5km for quick pickup.`;
  } else if (foodType === "non-veg") {
    return `🍗 Non-veg food. Ensure cold storage during transport. Recommend pickup within ${Math.min(hoursLeft, 4)} hours.`;
  } else if (quantity > 50) {
    return `📦 Large batch of ${quantity} units. Consider splitting between multiple NGOs for faster distribution.`;
  } else {
    return `✅ Food in good condition with ${hoursLeft} hours remaining. Standard distribution recommended.`;
  }
};

// Calculate carbon saved (approx 2.5kg CO2 per kg of food saved)
const calculateCarbonSaved = (quantity, unit) => {
  const kgMap = { kg: 1, plates: 0.3, litres: 0.8, boxes: 1.5, packets: 0.2, servings: 0.25 };
  return (quantity * (kgMap[unit] || 1) * 2.5).toFixed(2);
};

// @route   POST /api/food
// @desc    Create food listing
// @access  Private (donor)
const createFood = async (req, res) => {
  try {
    const {
      title, description, quantity, quantityUnit,
      foodType, location, coordinates, expiryTime, images,
    } = req.body;

    const aiSuggestion = generateAISuggestion(title, expiryTime, quantity, foodType);
    const carbonSaved = calculateCarbonSaved(quantity, quantityUnit || "kg");

    const food = await Food.create({
      title, description, quantity, quantityUnit, foodType,
      location, coordinates, expiryTime, images,
      donor: req.user._id,
      aiSuggestion,
      carbonSaved,
    });

    // Update donor stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalDonations: 1, rewardPoints: 10 },
    });

    await food.populate("donor", "name email phone");

    res.status(201).json({ success: true, message: "Food listed successfully!", food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/food
// @desc    Get all available food listings
// @access  Public
const getAllFood = async (req, res) => {
  try {
    const { status, foodType, page = 1, limit = 10, search } = req.query;

    const query = { isAvailable: true };
    if (status) query.status = status;
    if (foodType) query.foodType = foodType;
    if (search) query.title = { $regex: search, $options: "i" };

    // Only show non-expired food
    query.expiryTime = { $gt: new Date() };

    const skip = (page - 1) * limit;

    const foods = await Food.find(query)
      .populate("donor", "name email phone address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Food.countDocuments(query);

    res.json({
      success: true,
      count: foods.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      foods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/food/:id
// @desc    Get single food item
// @access  Public
const getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).populate("donor", "name email phone address");

    if (!food) {
      return res.status(404).json({ success: false, message: "Food not found." });
    }

    res.json({ success: true, food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/food/my/listings
// @desc    Get donor's own food listings
// @access  Private (donor)
const getMyListings = async (req, res) => {
  try {
    const foods = await Food.find({ donor: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: foods.length, foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/food/:id
// @desc    Update food listing
// @access  Private (donor - own only)
const updateFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) return res.status(404).json({ success: false, message: "Food not found." });
    if (food.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    const updated = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("donor", "name email");

    res.json({ success: true, message: "Food updated.", food: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/food/:id
// @desc    Delete food listing
// @access  Private (donor - own / admin)
const deleteFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) return res.status(404).json({ success: false, message: "Food not found." });

    if (food.donor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    await food.deleteOne();
    res.json({ success: true, message: "Food listing deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/food/:id/status
// @desc    Update food status
// @access  Private
const updateFoodStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("donor", "name email");

    if (!food) return res.status(404).json({ success: false, message: "Food not found." });

    res.json({ success: true, message: `Food status updated to '${status}'.`, food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/food/stats/summary
// @desc    Get food stats (admin/dashboard)
// @access  Private
const getFoodStats = async (req, res) => {
  try {
    const total = await Food.countDocuments();
    const pending = await Food.countDocuments({ status: "pending" });
    const delivered = await Food.countDocuments({ status: "delivered" });
    const expired = await Food.countDocuments({ status: "expired" });

    const carbonData = await Food.aggregate([
      { $group: { _id: null, totalCarbon: { $sum: "$carbonSaved" } } },
    ]);
    const totalCarbonSaved = carbonData[0]?.totalCarbon || 0;

    res.json({
      success: true,
      stats: { total, pending, delivered, expired, totalCarbonSaved },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createFood, getAllFood, getFoodById, getMyListings,
  updateFood, deleteFood, updateFoodStatus, getFoodStats,
};