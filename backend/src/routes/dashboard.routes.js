const express = require("express");
const router = express.Router();

const controller = require("../controllers/dashboard.controller");
const verifyToken = require("../../middleware/authMiddleware");

router.get("/summary", verifyToken, controller.getDashboard);

module.exports = router;
