const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/review.controller");
const verifyToken = require("../../middleware/authMiddleware");

// ================= PROTECTED ROUTES =================
router.get("/today", verifyToken, reviewController.getTodayReview);
router.get("/stats", verifyToken, reviewController.getStats);
router.get("/streak", verifyToken, reviewController.getStreak);
router.get("/topics", verifyToken, reviewController.getTopics);

// ================= PROTECTED GENERAL =================
router.get("/", verifyToken, reviewController.getReviewWords);
router.post("/", verifyToken, reviewController.updateReview);

module.exports = router;
