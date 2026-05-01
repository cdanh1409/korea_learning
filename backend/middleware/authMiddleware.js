const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // ================= DEBUG =================
  console.log("🔥 VERIFY TOKEN ACTIVE");
  console.log("🔥 URL:", req.originalUrl);
  console.log("🔥 METHOD:", req.method);
  console.log("🔥 AUTH HEADER:", req.headers.authorization);
  console.log("🔥 THIS IS AUTH MIDDLEWARE FILE A");
  // ================= GET HEADER =================
  const authHeader = req.headers.authorization;

  // ❌ không có header
  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided",
      code: "NO_TOKEN",
    });
  }

  // ❌ sai format
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Invalid token format",
      code: "INVALID_FORMAT",
    });
  }

  // ================= EXTRACT TOKEN =================
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token missing",
      code: "TOKEN_MISSING",
    });
  }

  // ================= VERIFY =================
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    console.log("✅ TOKEN VALID USER:", decoded);

    return next();
  } catch (err) {
    console.error("❌ JWT ERROR:", err.message);

    return res.status(401).json({
      message: "Token expired or invalid",
      code: "TOKEN_INVALID",
    });
  }
};

module.exports = verifyToken;
