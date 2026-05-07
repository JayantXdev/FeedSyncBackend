const NGO = require("../model/NGO.model");
const User = require("../model/User.model");

// @route   POST /api/ngo/register
// @desc    Register NGO profile (linked to user)
// @access  Private (ngo role)
const registerNGO = async (req, res) => {
  try {
    const existing = await NGO.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "NGO profile already exists." });
    }

    const {
      name, description, location, coordinates,
      capacity, contact, email, website, registrationNumber,
    } = req.body;

    const ngo = await NGO.create({
      user: req.user._id,
      name, description, location, coordinates,
      capacity, contact, email, website, registrationNumber,
    });

    res.status(201).json({ success: true, message: "NGO registered successfully!", ngo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/ngo
// @desc    Get all verified NGOs
// @access  Public
const getAllNGOs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;
    const ngos = await NGO.find(query)
      .populate("user", "name email")
      .sort({ rating: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NGO.countDocuments(query);

    res.json({ success: true, count: ngos.length, total, ngos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/ngo/:id
// @desc    Get single NGO
// @access  Public
const getNGOById = async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id).populate("user", "name email");
    if (!ngo) return res.status(404).json({ success: false, message: "NGO not found." });
    res.json({ success: true, ngo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/ngo/my/profile
// @desc    Get my NGO profile
// @access  Private (ngo)
const getMyNGO = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id }).populate("user", "name email");
    if (!ngo) return res.status(404).json({ success: false, message: "NGO profile not found. Please register." });
    res.json({ success: true, ngo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/ngo/my/profile
// @desc    Update my NGO profile
// @access  Private (ngo)
const updateNGO = async (req, res) => {
  try {
    const ngo = await NGO.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!ngo) return res.status(404).json({ success: false, message: "NGO profile not found." });
    res.json({ success: true, message: "NGO profile updated.", ngo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/ngo/:id/verify
// @desc    Verify an NGO (admin only)
// @access  Private (admin)
const verifyNGO = async (req, res) => {
  try {
    const ngo = await NGO.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );
    if (!ngo) return res.status(404).json({ success: false, message: "NGO not found." });

    // Also verify the linked user
    await User.findByIdAndUpdate(ngo.user, { isVerified: true });

    res.json({ success: true, message: "NGO verified successfully.", ngo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/ngo/nearby
// @desc    Get nearby NGOs (simple distance filter by location string for now)
// @access  Public
const getNearbyNGOs = async (req, res) => {
  try {
    const { location } = req.query;
    const ngos = await NGO.find({
      location: { $regex: location, $options: "i" },
      isVerified: true,
    }).populate("user", "name email").limit(10);

    res.json({ success: true, count: ngos.length, ngos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerNGO, getAllNGOs, getNGOById, getMyNGO, updateNGO, verifyNGO, getNearbyNGOs };