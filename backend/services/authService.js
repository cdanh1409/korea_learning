const { connectDB } = require("../db/db");
const bcrypt = require("bcrypt");

exports.register = async ({ email, password }) => {
  const db = await connectDB();

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.request().input("email", email).input("password", hashedPassword)
    .query(`
        INSERT INTO Users (Email, PasswordHash)
        VALUES (@email, @password)
    `);

  return { message: "Registered successfully" };
};
