const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  registerNGO,
  getAllNGOs,
  getNGOById,
  getMyNGO,
  updateNGO,
  verifyNGO,
  getNearbyNGOs,
} = require("../controllers/ngoController");

// Public routes
router.get("/", getAllNGOs);
router.get("/nearby", getNearbyNGOs);
router.get("/:id", getNGOById);

// Protected routes
router.post("/register", protect, authorize("ngo"), registerNGO);
router.get("/my/profile", protect, authorize("ngo"), getMyNGO);
router.put("/my/profile", protect, authorize("ngo"), updateNGO);
router.put("/:id/verify", protect, authorize("admin"), verifyNGO);

module.exports = router;