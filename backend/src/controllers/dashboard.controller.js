const { pool, poolConnect, sql } = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    await poolConnect;

    const userId = 1;

    // ================= LAST 7 DAYS DATA =================
    const weekRes = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT 
          CAST(LastReviewed AS DATE) AS day,
          ISNULL(SUM(CorrectCount),0) AS learned,
          ISNULL(SUM(WrongCount),0) AS reviewed
        FROM UserVocabularyProgress
        WHERE UserId = @userId
          AND LastReviewed >= DATEADD(DAY, -6, GETDATE())
        GROUP BY CAST(LastReviewed AS DATE)
        ORDER BY day ASC
      `);

    const weekMap = weekRes.recordset || [];

    const weeklyData = weekMap.map((x) => Number(x.learned || 0));

    const totalNewWeek = weekMap.reduce((s, x) => s + (x.learned || 0), 0);
    const totalReviewWeek = weekMap.reduce((s, x) => s + (x.reviewed || 0), 0);

    // ================= TODAY (derived from week) =================
    const todayData = weekMap.find(
      (x) =>
        new Date(x.day).toISOString().split("T")[0] ===
        new Date().toISOString().split("T")[0],
    ) || { learned: 0, reviewed: 0 };

    // ================= STREAK =================
    const streakRes = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT DISTINCT CAST(LastReviewed AS DATE) AS reviewDate
        FROM UserVocabularyProgress
        WHERE UserId = @userId
        ORDER BY reviewDate DESC
      `);

    const dates = streakRes.recordset.map((r) => r.reviewDate);

    let streak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      d.setHours(0, 0, 0, 0);

      const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));

      if (i === 0 && diff > 1) break;
      if (diff === i) streak++;
      else break;
    }

    // ================= TOPIK =================
    const topikRes = await pool.request().query(`
      SELECT 
        SUM(CASE WHEN Level <= 2 THEN 1 ELSE 0 END) AS level12,
        SUM(CASE WHEN Level >= 3 THEN 1 ELSE 0 END) AS level34
      FROM Vocabulary
    `);

    const t = topikRes.recordset[0];
    const total = (t.level12 || 0) + (t.level34 || 0);

    // ================= WEEK GOAL =================
    const goalRes = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT TOP 1 *
        FROM UserWeeklyGoal
        WHERE UserId = @userId
        ORDER BY WeekStart DESC
      `);

    const goal = goalRes.recordset[0] || {};

    // ================= RESPONSE CLEAN =================
    res.json({
      stats: {
        todayNew: todayData.learned,
        todayReview: todayData.reviewed,

        weekNew: totalNewWeek,
        weekReview: totalReviewWeek,

        goalNew: goal.TargetNewWords || 60,
        goalReview: goal.TargetReview || 50,

        streak,
      },

      weeklyData,

      topik: {
        level12: total ? Math.round((t.level12 / total) * 100) : 0,
        level34: total ? Math.round((t.level34 / total) * 100) : 0,
      },

      weekGoal: {
        new: {
          current: totalNewWeek,
          total: goal.TargetNewWords || 60,
        },
        review: {
          current: totalReviewWeek,
          total: goal.TargetReview || 50,
        },
        exercise: {
          current: goal.CurrentExercise || 10,
          total: goal.TargetExercise || 20,
        },
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "server error" });
  }
};
