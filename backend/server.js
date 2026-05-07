require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("==================================");
  console.log("🚀 Server running");
  console.log(`📌 http://localhost:${PORT}`);
  console.log("🌍 ENV:", process.env.NODE_ENV);
  console.log("==================================");
});
