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

    // ================= TOTAL WORDS =================
    const totalResult = await request.query(`
      SELECT COUNT(*) AS totalWords
      FROM UserVocabularyProgress
      WHERE UserId = @userId AND IsActive = 1
    `);

    // ================= MASTERED =================
    const masteredResult = await request.query(`
      SELECT COUNT(*) AS masteredWords
      FROM UserVocabularyProgress
      WHERE UserId = @userId
        AND IsLearned = 1
        AND IsActive = 1
    `);

    // ================= WEAK WORDS =================
    const weakResult = await request.query(`
      SELECT COUNT(*) AS weakWords
      FROM UserVocabularyProgress
      WHERE UserId = @userId
        AND NextReview <= GETDATE()
        AND IsActive = 1
    `);

    // ================= AVG SCORE =================
    const avgResult = await request.query(`
      SELECT AVG(
        CASE 
          WHEN (CorrectCount + WrongCount) = 0 THEN 0
          ELSE (CorrectCount * 1.0) / (CorrectCount + WrongCount)
        END
      ) AS avgScore
      FROM UserVocabularyProgress
      WHERE UserId = @userId
        AND IsActive = 1
    `);

    const avgScoreRaw = avgResult.recordset[0]?.avgScore;
    const avgScore = Number(avgScoreRaw || 0).toFixed(2);

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

    // ================= RESPONSE =================
    res.json({
      totalWords: totalResult.recordset[0]?.totalWords || 0,
      masteredWords: masteredResult.recordset[0]?.masteredWords || 0,
      weakWords: weakResult.recordset[0]?.weakWords || 0,
      avgScore,
      weeklyScore: last7Days,
    });
  } catch (err) {
    console.log("❌ Stats API error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

module.exports = router;
