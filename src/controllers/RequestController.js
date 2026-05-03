const Request = require("../models/Request");
const Food = require("../models/Food");
const NGO = require("../models/NGO");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Helper to create a notification
const notify = async (recipientId, type, title, message, foodId, requestId) => {
  await Notification.create({
    recipient: recipientId,
    type,
    title,
    message,
    relatedFood: foodId,
    relatedRequest: requestId,
  });
};

// @route   POST /api/requests
// @desc    NGO requests a food item
// @access  Private (ngo)
const createRequest = async (req, res) => {
  try {
    const { foodId, note, pickupTime } = req.body;

    const food = await Food.findById(foodId).populate("donor");
    if (!food) return res.status(404).json({ success: false, message: "Food not found." });
    if (!food.isAvailable || food.status !== "pending") {
      return res.status(400).json({ success: false, message: "This food is no longer available." });
    }

    // Check if expiry passed
    if (new Date(food.expiryTime) < new Date()) {
      return res.status(400).json({ success: false, message: "This food has already expired." });
    }

    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) return res.status(400).json({ success: false, message: "Please complete your NGO profile first." });

    // Check if already requested
    const alreadyRequested = await Request.findOne({ food: foodId, ngo: ngo._id, status: { $in: ["requested", "accepted"] } });
    if (alreadyRequested) {
      return res.status(400).json({ success: false, message: "You already have an active request for this food." });
    }

    const request = await Request.create({
      food: foodId,
      ngo: ngo._id,
      requestedBy: req.user._id,
      note,
      pickupTime,
    });

    // Mark food as no longer available for new requests
    await Food.findByIdAndUpdate(foodId, { isAvailable: false, status: "accepted" });

    // Notify donor
    await notify(
      food.donor._id,
      "request_received",
      "New Food Request!",
      `${ngo.name} has requested your food: "${food.title}"`,
      foodId,
      request._id
    );

    await request.populate(["food", { path: "ngo", populate: "user" }, "requestedBy"]);

    res.status(201).json({ success: true, message: "Request sent successfully!", request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/requests
// @desc    Get all requests (admin)
// @access  Private (admin)
const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate("food", "title quantity location expiryTime")
      .populate({ path: "ngo", populate: { path: "user", select: "name email" } })
      .populate("requestedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/requests/my
// @desc    Get NGO's own requests
// @access  Private (ngo)
const getMyRequests = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) return res.status(404).json({ success: false, message: "NGO profile not found." });

    const requests = await Request.find({ ngo: ngo._id })
      .populate("food", "title quantity location expiryTime foodType aiSuggestion")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/requests/donor
// @desc    Get requests for donor's food
// @access  Private (donor)
const getDonorRequests = async (req, res) => {
  try {
    const myFoods = await Food.find({ donor: req.user._id }).select("_id");
    const foodIds = myFoods.map((f) => f._id);

    const requests = await Request.find({ food: { $in: foodIds } })
      .populate("food", "title quantity location expiryTime")
      .populate({ path: "ngo", populate: { path: "user", select: "name email phone" } })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/requests/:id
// @desc    Get single request
// @access  Private
const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("food")
      .populate({ path: "ngo", populate: { path: "user", select: "name email" } })
      .populate("requestedBy", "name email");

    if (!request) return res.status(404).json({ success: false, message: "Request not found." });
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/requests/:id/accept
// @desc    Donor accepts a request
// @access  Private (donor)
const acceptRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("food").populate("ngo");
    if (!request) return res.status(404).json({ success: false, message: "Request not found." });

    if (request.food.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    request.status = "accepted";
    await request.save();

    await notify(
      request.requestedBy,
      "request_accepted",
      "Request Accepted! 🎉",
      `Your request for "${request.food.title}" has been accepted. Please pick it up on time.`,
      request.food._id,
      request._id
    );

    res.json({ success: true, message: "Request accepted.", request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/requests/:id/reject
// @desc    Donor rejects a request
// @access  Private (donor)
const rejectRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const request = await Request.findById(req.params.id).populate("food");
    if (!request) return res.status(404).json({ success: false, message: "Request not found." });

    if (request.food.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    request.status = "rejected";
    request.rejectionReason = rejectionReason || "No reason provided.";
    await request.save();

    // Make food available again
    await Food.findByIdAndUpdate(request.food._id, { isAvailable: true, status: "pending" });

    await notify(
      request.requestedBy,
      "request_rejected",
      "Request Rejected",
      `Your request for "${request.food.title}" was rejected. Reason: ${request.rejectionReason}`,
      request.food._id,
      request._id
    );

    res.json({ success: true, message: "Request rejected.", request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/requests/:id/picked
// @desc    Mark food as picked up
// @access  Private (ngo)
const markPicked = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("food");
    if (!request) return res.status(404).json({ success: false, message: "Request not found." });

    request.status = "picked";
    await request.save();

    await Food.findByIdAndUpdate(request.food._id, { status: "picked" });

    await notify(
      request.food.donor,
      "food_picked",
      "Food Picked Up!",
      `Your food "${request.food.title}" has been picked up successfully.`,
      request.food._id,
      request._id
    );

    res.json({ success: true, message: "Marked as picked.", request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/requests/:id/complete
// @desc    Mark request as completed / delivered
// @access  Private (ngo or admin)
const completeRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("food");
    if (!request) return res.status(404).json({ success: false, message: "Request not found." });

    request.status = "completed";
    request.deliveredAt = new Date();
    await request.save();

    await Food.findByIdAndUpdate(request.food._id, { status: "delivered" });

    // Update NGO stats
    await NGO.findByIdAndUpdate(request.ngo, {
      $inc: { totalFoodReceived: request.food.quantity },
    });

    // Reward donor
    await User.findByIdAndUpdate(request.food.donor, {
      $inc: { rewardPoints: 20, trustScore: 1 },
    });

    await notify(
      request.food.donor,
      "food_delivered",
      "Food Delivered! ✅",
      `"${request.food.title}" has been successfully delivered to the NGO.`,
      request.food._id,
      request._id
    );

    res.json({ success: true, message: "Request completed successfully!", request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequest, getAllRequests, getMyRequests, getDonorRequests,
  getRequestById, acceptRequest, rejectRequest, markPicked, completeRequest,
};