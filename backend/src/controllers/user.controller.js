const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");

const { pool, poolConnect, sql } = require("../config/db");

/* ======================================================
   RATE LIMIT
====================================================== */
exports.forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ======================================================
   HELPERS
====================================================== */
function isValidPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/* ======================================================
   GET PROFILE
====================================================== */
exports.getProfile = async (req, res) => {
  try {
    await poolConnect;

    const userId = Number(req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT
          Id,
          Email,
          FullName,
          Avatar,
          EmailVerified,
          CreatedAt,
          LastLoginAt,
          UpdatedAt
        FROM Users
        WHERE Id = @userId
      `);

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user.Id,
      email: user.Email,
      fullName: user.FullName || "",

      avatarUrl: user.Avatar
        ? `data:image/png;base64,${Buffer.from(user.Avatar).toString("base64")}`
        : "",

      emailVerified: user.EmailVerified,
      createdAt: user.CreatedAt,
      lastLoginAt: user.LastLoginAt,
      updatedAt: user.UpdatedAt,
    });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   UPDATE PROFILE
====================================================== */
exports.updateProfile = async (req, res) => {
  try {
    await poolConnect;

    const userId = Number(req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const fullName = sanitizeString(req.body?.fullName);
    const avatarBuffer = req.file?.buffer || null;

    await pool
      .request()
      .input("Id", sql.Int, userId)
      .input("FullName", sql.NVarChar, fullName)
      .input("Avatar", sql.VarBinary(sql.MAX), avatarBuffer).query(`
        UPDATE Users
        SET
          FullName = @FullName,
          Avatar = COALESCE(@Avatar, Avatar),
          UpdatedAt = GETDATE()
        WHERE Id = @Id
      `);

    return res.json({
      success: true,
      message: "Profile updated",
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({
      message: "Update profile failed",
    });
  }
};

/* ======================================================
   CHANGE PASSWORD
====================================================== */
exports.changePassword = async (req, res) => {
  try {
    await poolConnect;

    const userId = Number(req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const oldPassword = sanitizeString(req.body?.oldPassword);
    const newPassword = sanitizeString(req.body?.newPassword);

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.",
      });
    }

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT PasswordHash
        FROM Users
        WHERE Id = @userId
      `);

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.PasswordHash);

    if (!isMatch) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    const hash = await bcrypt.hash(newPassword, 12);

    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("hash", sql.NVarChar(sql.MAX), hash).query(`
        UPDATE Users
        SET PasswordHash = @hash,
            UpdatedAt = GETDATE()
        WHERE Id = @userId
      `);

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
