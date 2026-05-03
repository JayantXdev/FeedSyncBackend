const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  verifyUser,
  getAllFoodAdmin,
} = require("../controllers/adminController");

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/verify", verifyUser);
router.get("/food", getAllFoodAdmin);

module.exports = router;