const { pool, poolConnect } = require("../src/config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ❌ XÓA CÁI NÀY
// const SECRET_KEY = "secret_key";

// ✅ DÙNG ENV
const SECRET_KEY = process.env.JWT_SECRET;

// REGISTER
exports.register = async (data) => {
  await poolConnect;

  const { email, password } = data || {};

  if (!email || !password) {
    throw new Error("Missing email or password");
  }

  const check = await pool
    .request()
    .input("email", email)
    .query("SELECT * FROM Users WHERE Email = @email");

  if (check.recordset.length > 0) {
    throw new Error("Email already exists");
  }

  const hash = await bcrypt.hash(password, 10);

  await pool.request().input("email", email).input("password", hash).query(`
      INSERT INTO Users (Email, PasswordHash, CreatedAt)
      VALUES (@email, @password, GETDATE())
    `);

  return { message: "Register success" };
};

// LOGIN
exports.login = async ({ email, password }) => {
  await poolConnect;

  const result = await pool
    .request()
    .input("email", email)
    .query("SELECT * FROM Users WHERE Email = @email");

  const user = result.recordset[0];

  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.PasswordHash);

  if (!isMatch) throw new Error("Wrong password");

  // 🔥 FIX HERE
  const token = jwt.sign(
    {
      id: user.Id,
      email: user.Email,
    },
    SECRET_KEY, // MUST MATCH middleware
    {
      expiresIn: "1d",
    },
  );

  return {
    token,
    user: {
      id: user.Id,
      email: user.Email,
    },
  };
};
