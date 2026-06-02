const express = require("express");
const router = express.Router();

const wordController = require("../controllers/word.controller");
const verifyToken = require("../../middleware/authMiddleware");

// ================= PROTECTED ROUTES =================
router.get("/", verifyToken, wordController.getWords);

module.exports = router;
