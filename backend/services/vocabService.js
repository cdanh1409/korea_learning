const { pool } = require("../db/db");

exports.getByFilter = async (level, topicId) => {
    const db = await pool;

    const result = await db.request()
        .input("level", level)
        .input("topicId", topicId)
        .query(`
            SELECT *
            FROM Vocabulary
            WHERE Level = @level AND TopicId = @topicId
        `);

    return result.recordset;
};