const { pool, poolConnect, sql } = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // ================= WEEK REVIEW =================
    const weekRes = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT 
          CAST(LastReviewed AS DATE) AS day,
          COUNT(DISTINCT VocabularyId) AS reviewCount
        FROM UserVocabularyProgress
        WHERE UserId = @userId
          AND LastReviewed >= DATEADD(DAY, -6, GETDATE())
        GROUP BY CAST(LastReviewed AS DATE)
      `);

    const reviewMap = new Map(
      (weekRes.recordset || []).map((x) => [
        new Date(x.day).toISOString().slice(0, 10),
        x.reviewCount,
      ]),
    );

    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const key = d.toISOString().slice(0, 10);
      weeklyData.push(reviewMap.get(key) || 0);
    }

    const weekReview = weeklyData.reduce((a, b) => a + b, 0);

    // ================= 📖 REVIEWED WORDS =================
    const reviewedRes = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT COUNT(DISTINCT VocabularyId) AS reviewedWords
        FROM UserVocabularyProgress
        WHERE UserId = @userId
          AND LastReviewed >= DATEADD(DAY, -6, GETDATE())
      `);

    const reviewedWords = reviewedRes.recordset?.[0]?.reviewedWords || 0;

    // ================= 🆕 NEW WORDS (CHƯA HỌC) =================
    const newRes = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT COUNT(*) AS newWords
        FROM Vocabulary v
        WHERE v.Id NOT IN (
          SELECT DISTINCT VocabularyId
          FROM UserVocabularyProgress
          WHERE UserId = @userId
        )
      `);

    const newWords = newRes.recordset?.[0]?.newWords || 0;

    // ================= 🔥 STREAK =================
    const streakRes = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT DISTINCT CAST(LastReviewed AS DATE) AS reviewDate
        FROM UserVocabularyProgress
        WHERE UserId = @userId
        ORDER BY reviewDate DESC
      `);

    const dates = streakRes.recordset || [];

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i].reviewDate);
      d.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));

      if (i === 0 && diffDays > 1) break;
      if (diffDays === i) streak++;
      else break;
    }

    // ================= 📊 TOPIK =================
    const topikRes = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT 
          SUM(CASE WHEN v.Level <= 2 THEN 1 ELSE 0 END) AS level12,
          SUM(CASE WHEN v.Level >= 3 THEN 1 ELSE 0 END) AS level34
        FROM Vocabulary v
        WHERE v.Id IN (
          SELECT DISTINCT VocabularyId
          FROM UserVocabularyProgress
          WHERE UserId = @userId
        )
      `);

    const t = topikRes.recordset?.[0] || {};

    return res.json({
      stats: {
        newWords,
        reviewedWords,
        weekReview,
        streak,
        goalNew: 60,
        goalReview: 50,
      },

      weeklyData,

      topik: {
        level12: t.level12 || 0,
        level34: t.level34 || 0,
      },

      weekGoal: {
        new: { current: newWords, total: 60 },
        review: { current: reviewedWords, total: 50 },
        exercise: { current: 0, total: 20 },
      },
    });
  } catch (err) {
    console.error("❌ Dashboard error:", err);
    return res.status(500).json({ error: err.message });
  }
};
