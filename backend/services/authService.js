const { pool, poolConnect } = require("../src/config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = "secret_key";

// REGISTER
exports.register = async ({ email, password }) => {
  const db = await poolConnect;

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
  const db = await poolConnect;

  const result = await pool
    .request()
    .input("email", email)
    .query("SELECT * FROM Users WHERE Email = @email");

  const user = result.recordset[0];

  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.PasswordHash);

  if (!isMatch) throw new Error("Wrong password");

  const token = jwt.sign({ id: user.Id, email: user.Email }, SECRET_KEY, {
    expiresIn: "1d",
  });

  return {
    token,
    user: {
      id: user.Id,
      email: user.Email,
    },
  };
};
