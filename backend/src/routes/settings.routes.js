const express = require("express");
const router = express.Router();

const verifyToken = require("../../middleware/authMiddleware");

const {
  getSettings,
  saveSettings,
} = require("../controllers/settings.controller");

// 🔥 PROTECT ALL SETTINGS ROUTES
router.get("/", verifyToken, getSettings);
router.post("/", verifyToken, saveSettings);

module.exports = router;
