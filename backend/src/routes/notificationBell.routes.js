const express = require("express");
const router = express.Router();

const controller = require("../controllers/notificationBell.controller");
const verifyToken = require("../../middleware/authMiddleware");

// 🔔 get due words count
router.get("/count", verifyToken, controller.getDueCount);

// 🔔 get due words list (dropdown)
router.get("/list", verifyToken, controller.getDueList);

module.exports = router;
