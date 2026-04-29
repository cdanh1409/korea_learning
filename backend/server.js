<<<<<<< HEAD
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", require("./routes/authRoutes")); // 🔥 THÊM DÒNG NÀY
app.use("/api/topics", require("./routes/topicRoutes"));
app.use("/api/vocabulary", require("./routes/vocabRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
=======
const app = require("./src/app");

const PORT = 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on http://localhost:5000");
>>>>>>> 75c31bd (commit 1)
});
