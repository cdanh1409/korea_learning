const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/review.controller");

// SPECIFIC ROUTES trước
router.get("/today", reviewController.getTodayReview);
router.get("/stats", reviewController.getStats);
router.get("/streak", reviewController.getStreak);

// GENERAL ROUTES sau
router.get("/", reviewController.getReviewWords);
router.post("/:id", reviewController.updateReview);

module.exports = router;
