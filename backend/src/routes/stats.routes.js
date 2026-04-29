const express = require("express");
const router = express.Router();
const { pool, poolConnect } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    await poolConnect;
    const request = pool.request();

    // 1. tổng từ
    const totalResult = await request.query(`
      SELECT COUNT(*) AS totalWords FROM Vocabulary
    `);

    // 2. mastered (Level >= 3 coi như đã thuộc)
    const masteredResult = await request.query(`
      SELECT COUNT(*) AS masteredWords 
      FROM Vocabulary
      WHERE Level >= 3
    `);

    // 3. weak words (đến hạn ôn)
    const weakResult = await request.query(`
      SELECT COUNT(*) AS weakWords 
      FROM Vocabulary
      WHERE nextReview <= GETDATE()
    `);

    // 4. avg score giả lập (dựa trên Level)
    const avgResult = await request.query(`
      SELECT AVG(CAST(Level AS FLOAT)) AS avgScore 
      FROM Vocabulary
    `);

    // 5. weekly score giả lập (7 ngày)
    const weeklyScore = [2, 5, 3, 6, 4, 7, 5];

    res.json({
      totalWords: totalResult.recordset[0].totalWords,
      masteredWords: masteredResult.recordset[0].masteredWords,
      weakWords: weakResult.recordset[0].weakWords,
      avgScore: Number(avgResult.recordset[0].avgScore.toFixed(1)),
      weeklyScore,
    });
  } catch (err) {
    console.log("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
