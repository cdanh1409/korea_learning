const express = require("express");
const router = express.Router();

const controller = require("../controllers/vocabulary.controller");

// GET SRS vocab
router.get("/", controller.getAllVocabulary);

// UPDATE SRS
router.post("/review", controller.updateReview);

module.exports = router;
