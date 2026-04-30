require("dotenv").config();

const app = require("./src/app");

const PORT = 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running...");
});
