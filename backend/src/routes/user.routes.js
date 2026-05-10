const express = require("express");

const router = express.Router();

const userController = require("../controllers/user.controller");

const auth = require("../../middleware/authMiddleware");

const upload = require("../middlewares/upload");

router.get("/profile", auth, userController.getProfile);

router.put(
  "/profile",
  auth,
  upload.single("avatar"),
  userController.updateProfile,
);

router.post("/change-password", auth, userController.changePassword);

module.exports = router;
