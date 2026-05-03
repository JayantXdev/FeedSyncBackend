const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  getDonorRequests,
  getRequestById,
  acceptRequest,
  rejectRequest,
  markPicked,
  completeRequest,
} = require("../controllers/requestController");

// All routes are protected
router.use(protect);

router.post("/", authorize("ngo"), createRequest);
router.get("/", authorize("admin"), getAllRequests);
router.get("/my", authorize("ngo"), getMyRequests);
router.get("/donor", authorize("donor"), getDonorRequests);
router.get("/:id", getRequestById);
router.put("/:id/accept", authorize("donor"), acceptRequest);
router.put("/:id/reject", authorize("donor"), rejectRequest);
router.put("/:id/picked", authorize("ngo"), markPicked);
router.put("/:id/complete", authorize("ngo", "admin"), completeRequest);

module.exports = router;