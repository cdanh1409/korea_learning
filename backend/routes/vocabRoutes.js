const express = require("express");
const router = express.Router();
const vocabController = require("../controllers/vocabController");

router.get("/", vocabController.getByFilter);

module.exports = router;
