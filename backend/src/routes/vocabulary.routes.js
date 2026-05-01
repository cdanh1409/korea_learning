const express = require("express");
const router = express.Router();

const controller = require("../controllers/vocabulary.controller");
const verifyToken = require("../../middleware/authMiddleware");

router.get("/", verifyToken, controller.getAllVocabulary);
router.post("/review", verifyToken, controller.updateReview);

module.exports = router;
