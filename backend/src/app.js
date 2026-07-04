const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// 🔥 GLOBAL CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  }),
);

app.use(express.json());

// 🔥 STATIC IMAGE
app.use("/images", express.static(path.join(__dirname, "../public/images")));

// 🔥 LOG
app.use((req, res, next) => {
  console.log("\n==============================");
  console.log("🔥", req.method, req.url);
  console.log("🌐 ORIGIN:", req.headers.origin);
  console.log("🔑 AUTH:", req.headers.authorization);
  console.log("==============================");
  next();
});

// ROUTES
app.use("/api/auth", require("../routes/authRoutes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/vocabularies", require("./routes/vocabulary.routes"));
app.use("/api/topics", require("./routes/topics.routes"));
app.use("/api/stats", require("./routes/stats.routes"));
app.use("/api/review", require("./routes/review.routes"));
app.use("/api/settings", require("./routes/settings.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/words", require("./routes/word.routes"));
app.use("/api/notifications", require("./routes/notificationBell.routes"));
app.use("/api/placement-test", require("./routes/placement.routes"));

app.get("/", (req, res) => {
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.log("💥 ERROR:", err.message);

  if (err.message === "UNAUTHORIZED") {
    return res.status(401).json({ message: "No token or invalid format" });
  }

  if (err.message === "INVALID_TOKEN") {
    return res.status(401).json({ message: "Token invalid" });
  }

  return res.status(500).json({ message: "Server error" });
});

module.exports = app;
