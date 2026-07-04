const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Bỏ qua preflight request
  if (req.method === "OPTIONS") {
    console.log("🟡 OPTIONS:", req.originalUrl);
    return next();
  }

  console.log("\n========== VERIFY TOKEN ==========");
  console.log("📌 URL:", req.method, req.originalUrl);
  console.log("📦 Headers:", req.headers);

  const authHeader = req.headers.authorization;

  console.log("🔑 Authorization Header:", authHeader);

  if (!authHeader) {
    console.log("❌ Authorization header not found");
    return next(new Error("UNAUTHORIZED"));
  }

  if (!authHeader.startsWith("Bearer ")) {
    console.log("❌ Authorization format invalid");
    return next(new Error("UNAUTHORIZED"));
  }

  const token = authHeader.split(" ")[1];

  console.log("🎫 Token:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ JWT Verify Success");
    console.log("👤 Decoded:", decoded);

    req.user = decoded;

    console.log("=================================\n");

    next();
  } catch (err) {
    console.log("❌ JWT Verify Failed");
    console.log("Message:", err.message);
    console.log("=================================\n");

    return next(new Error("INVALID_TOKEN"));
  }
};

module.exports = verifyToken;
