const { pool, poolConnect, sql } = require("../config/db");

const baseCondition = `
  WHERE p.UserId = @userId
    AND ISNULL(p.IsActive, 1) = 1
    AND p.NextReview <= GETDATE()
`;

/**
 * 🔔 COUNT
 */
exports.getDueCount = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT COUNT(*) AS Total
        FROM UserVocabularyProgress p
        ${baseCondition}
      `);

    res.json({
      count: result.recordset[0].Total || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🔔 LIST (KHÔNG LIMIT để KHỚP COUNT)
 */
exports.getDueList = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT
          v.Id,
          v.Word,
          v.Meaning,
          p.NextReview
        FROM UserVocabularyProgress p
        JOIN Vocabulary v ON v.Id = p.VocabularyId
        ${baseCondition}
        ORDER BY p.NextReview ASC
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
