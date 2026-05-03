const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { createRating, getNGORatings, getMyRatings } = require("../controllers/ratingController");

router.get("/ngo/:ngoId", getNGORatings);
router.use(protect);
router.post("/", authorize("donor"), createRating);
router.get("/my", getMyRatings);

module.exports = router;