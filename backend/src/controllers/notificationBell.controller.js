const { pool, poolConnect, sql } = require("../config/db");

/**
 * 🔔 COUNT - chỉ lấy số từ sắp tới hạn
 */
exports.getDueCount = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT COUNT(*) AS Total
        FROM UserVocabularyProgress
        WHERE UserId = @userId
          AND NextReview <= GETDATE()
          AND ISNULL(IsActive, 1) = 1
      `);

    res.json({ count: result.recordset[0].Total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🔔 LIST - chi tiết từ sắp tới hạn
 */
exports.getDueList = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT TOP 10
          v.Id,
          v.Word,
          v.Meaning,
          p.NextReview
        FROM UserVocabularyProgress p
        JOIN Vocabulary v ON v.Id = p.VocabularyId
        WHERE p.UserId = @userId
          AND p.NextReview <= GETDATE()
        ORDER BY p.NextReview ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
