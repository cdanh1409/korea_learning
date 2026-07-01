const express = require("express");
const router = express.Router();

const wordController = require("../controllers/word.controller");
const verifyToken = require("../../middleware/authMiddleware");

// GET WORDS
router.get("/", verifyToken, wordController.getWords);

// SAVE NOTE
router.put("/:id/note", verifyToken, wordController.updateWordNote);

// GET TOPICS
router.get("/topics", wordController.getAllTopics);
module.exports = router;
