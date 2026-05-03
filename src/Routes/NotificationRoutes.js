const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getMyNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
} = require("../controllers/notificationController");

router.use(protect);
router.get("/", getMyNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;