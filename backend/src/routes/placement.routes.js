const express = require("express");
const router = express.Router();

const placementController = require("../controllers/placement.controller");
const verifyToken = require("../../middleware/authMiddleware");

router.get("/questions", verifyToken, placementController.getQuestions);

router.post("/submit", verifyToken, placementController.submitTest);

router.get("/result", verifyToken, placementController.getResult);

module.exports = router;
