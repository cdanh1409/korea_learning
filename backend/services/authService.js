const { pool, poolConnect } = require("../src/config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ ENV CHECK
if (!process.env.JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is NOT defined in environment variables");
}

const SECRET_KEY = process.env.JWT_SECRET;

/* ================= REGISTER ================= */
exports.register = async (data) => {
  await poolConnect;

  const { email, password } = data || {};

  // ✅ validate input
  if (!email || !password) {
    throw new Error("Missing email or password");
  }

  try {
    const request = pool.request();

    const check = await request
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
  } catch (err) {
    console.error("❌ REGISTER SERVICE ERROR:", err);
    throw err;
  }
};

/* ================= LOGIN ================= */
exports.login = async (data) => {
  await poolConnect;

  const { email, password } = data || {};

  if (!email || !password) {
    throw new Error("Missing email or password");
  }

  try {
    const result = await pool
      .request()
      .input("email", email)
      .query("SELECT * FROM Users WHERE Email = @email");

    const user = result.recordset[0];

    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(password, user.PasswordHash);

    if (!isMatch) throw new Error("Wrong password");

    const token = jwt.sign(
      {
        id: user.Id,
        email: user.Email,
      },
      SECRET_KEY,
      { expiresIn: "1d" },
    );

    return {
      token,
      user: {
        id: user.Id,
        email: user.Email,
      },
    };
  } catch (err) {
    console.error("❌ LOGIN SERVICE ERROR:", err);
    throw err;
  }
};
