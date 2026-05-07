const User = require("../model/User.model");
const Food = require("../model/Food.model");
const NGO = require("../model/NGO.model");
const Request = require("../model/Request.model");
const Rating = require("../model/Rating.model");

// @route   GET /api/admin/dashboard
// @desc    Get platform-wide stats
// @access  Private (admin)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: "donor" });
    const totalNGOs = await User.countDocuments({ role: "ngo" });
    const totalFood = await Food.countDocuments();
    const deliveredFood = await Food.countDocuments({ status: "delivered" });
    const pendingFood = await Food.countDocuments({ status: "pending" });
    const totalRequests = await Request.countDocuments();
    const completedRequests = await Request.countDocuments({ status: "completed" });
    const verifiedNGOs = await NGO.countDocuments({ isVerified: true });

    const carbonData = await Food.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$carbonSaved" } } },
    ]);
    const totalCarbonSaved = carbonData[0]?.total || 0;

    // Monthly food donations for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyDonations = await Food.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalDonors, totalNGOs, totalFood, deliveredFood,
        pendingFood, totalRequests, completedRequests, verifiedNGOs, totalCarbonSaved,
      },
      monthlyDonations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (admin)
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;

    const skip = (page - 1) * limit;
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await User.countDocuments(query);

    res.json({ success: true, count: users.length, total, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private (admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, message: "User deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/admin/users/:id/verify
// @desc    Verify a user
// @access  Private (admin)
const verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, message: "User verified.", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/admin/food
// @desc    Get all food items with full details
// @access  Private (admin)
const getAllFoodAdmin = async (req, res) => {
  try {
    const foods = await Food.find()
      .populate("donor", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: foods.length, foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getAllUsers, deleteUser, verifyUser, getAllFoodAdmin };