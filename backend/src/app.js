const express = require("express");
const cors = require("cors");

const dashboardRoutes = require("./routes/dashboard.routes");
const vocabularyRoutes = require("./routes/vocabulary.routes");
const topicRoutes = require("./routes/topics.routes");
const statsRoutes = require("./routes/stats.routes");
const reviewRoutes = require("./routes/review.routes");
const settingsRoutes = require("./routes/settings.routes");
const authRoutes = require("../routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/vocabularies", vocabularyRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/settings", settingsRoutes);

module.exports = app;
