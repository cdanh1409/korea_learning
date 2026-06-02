const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authMiddleware");
const { pool, poolConnect, sql } = require("../config/db");

router.get("/", verifyToken, async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user.id;

    const request = pool.request();
    request.input("userId", sql.Int, userId);

    // ================= SINGLE QUERY (OPTIMIZED) =================
    const result = await request.query(`
      SELECT
        COUNT(*) AS totalWords,

        SUM(CASE WHEN IsLearned = 1 THEN 1 ELSE 0 END) AS masteredWords,

        SUM(
          CASE 
            WHEN IsLearned = 0 AND NextReview <= GETDATE() THEN 1 
            ELSE 0 
          END
        ) AS dueWords,

        SUM(
          CASE 
            WHEN IsLearned = 0 AND NextReview > GETDATE() THEN 1 
            ELSE 0 
          END
        ) AS newWords,

        AVG(
          CASE 
            WHEN (CorrectCount + WrongCount) = 0 THEN 0
            ELSE (CorrectCount * 1.0) / (CorrectCount + WrongCount)
          END
        ) AS avgScore

      FROM UserVocabularyProgress
      WHERE UserId = @userId AND IsActive = 1
    `);

    const stats = result.recordset[0];

    // ================= WEEKLY =================
    const weeklyResult = await request.query(`
      SELECT 
        CAST(LastReviewed AS DATE) AS date,
        COUNT(*) AS count
      FROM UserVocabularyProgress
      WHERE UserId = @userId
        AND LastReviewed >= DATEADD(DAY, -6, GETDATE())
        AND IsActive = 1
      GROUP BY CAST(LastReviewed AS DATE)
      ORDER BY date
    `);

    const last7Days = Array(7).fill(0);

    weeklyResult.recordset.forEach((row) => {
      const diff = Math.floor(
        (new Date() - new Date(row.date)) / (1000 * 60 * 60 * 24),
      );

      if (diff >= 0 && diff < 7) {
        last7Days[6 - diff] = row.count;
      }
    });

    res.json({
      totalWords: stats.totalWords || 0,
      masteredWords: stats.masteredWords || 0,
      dueWords: stats.dueWords || 0,
      newWords: stats.newWords || 0,
      avgScore: parseFloat(stats.avgScore || 0),
      weeklyScore: last7Days,
    });
  } catch (err) {
    console.log("❌ Stats API error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
