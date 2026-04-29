const express = require("express");
const router = express.Router();

const {
  getSettings,
  saveSettings,
} = require("../controllers/settings.controller");

router.get("/", getSettings);
router.post("/", saveSettings);

module.exports = router;
