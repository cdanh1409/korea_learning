const { pool } = require("../db/db");

exports.getAll = async () => {
    const db = await pool;
    const result = await db.request().query("SELECT * FROM Topics");
    return result.recordset;
};