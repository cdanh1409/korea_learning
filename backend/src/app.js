const express = require("express");
const cors = require("cors");

const app = express();

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json());

// ================= DEBUG LOGGER (QUAN TRỌNG) =================
app.use((req, res, next) => {
  console.log(`🔥 ${req.method} ${req.url}`);
  next();
});

// ================= ROUTES =================
const dashboardRoutes = require("./routes/dashboard.routes");
const vocabularyRoutes = require("./routes/vocabulary.routes");
const topicRoutes = require("./routes/topics.routes");
const statsRoutes = require("./routes/stats.routes");
const reviewRoutes = require("./routes/review.routes");
const settingsRoutes = require("./routes/settings.routes");
const authRoutes = require("../routes/authRoutes");

// AUTH
app.use("/api/auth", authRoutes);

// DASHBOARD
app.use("/api/dashboard", dashboardRoutes);

// VOCAB
app.use("/api/vocabularies", vocabularyRoutes);

// TOPICS
app.use("/api/topics", topicRoutes);

// STATS
app.use("/api/stats", statsRoutes);

// REVIEW (QUAN TRỌNG NHẤT CỦA BẠN)
app.use("/api/review", reviewRoutes);

// SETTINGS
app.use("/api/settings", settingsRoutes);

// ================= 404 HANDLER (FIX “No resource...”) =================
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    url: req.originalUrl,
  });
});

module.exports = app;
