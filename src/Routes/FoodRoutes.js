const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createFood,
  getAllFood,
  getFoodById,
  getMyListings,
  updateFood,
  deleteFood,
  updateFoodStatus,
  getFoodStats,
} = require("../controllers/foodController");

// Public routes
router.get("/", getAllFood);
router.get("/stats/summary", getFoodStats);
router.get("/:id", getFoodById);

// Protected routes
router.post("/", protect, authorize("donor", "admin"), createFood);
router.get("/my/listings", protect, authorize("donor"), getMyListings);
router.put("/:id", protect, updateFood);
router.delete("/:id", protect, deleteFood);
router.put("/:id/status", protect, updateFoodStatus);

module.exports = router;