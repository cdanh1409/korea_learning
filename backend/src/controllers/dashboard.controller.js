const { pool, poolConnect, sql } = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ================= LAST 7 DAYS =================
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

    // ================= FIX 7 DAYS FULL =================
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const found = weekMap.find((x) => {
        const xDate = new Date(x.day).toISOString().slice(0, 10);
        return xDate === dateStr;
      });

      weeklyData.push(found ? found.learned : 0);
    }

    const weekNew = weekMap.reduce((s, x) => s + (x.learned || 0), 0);
    const weekReview = weekMap.reduce((s, x) => s + (x.reviewed || 0), 0);

    // ================= TODAY =================
    const todayStr = new Date().toISOString().slice(0, 10);

    const todayData = weekMap.find((x) => {
      const xDate = new Date(x.day).toISOString().slice(0, 10);
      return xDate === todayStr;
    }) || { learned: 0, reviewed: 0 };

    // ================= STREAK =================
    const streakRes = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT DISTINCT CAST(LastReviewed AS DATE) AS reviewDate
        FROM UserVocabularyProgress
        WHERE UserId = @userId
        ORDER BY reviewDate DESC
      `);

    const dates = streakRes.recordset.map((r) => new Date(r.reviewDate));

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

    // ================= TOPIK (FIXED - USER BASED) =================
    const topikRes = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT 
          SUM(CASE WHEN v.Level <= 2 THEN 1 ELSE 0 END) AS level12,
          SUM(CASE WHEN v.Level >= 3 THEN 1 ELSE 0 END) AS level34
        FROM UserVocabularyProgress p
        JOIN Vocabulary v ON v.Id = p.VocabularyId
        WHERE p.UserId = @userId
      `);

    const t = topikRes.recordset?.[0] || {};

    const level12 = t.level12 || 0;
    const level34 = t.level34 || 0;
    const total = level12 + level34;

    // ================= WEEK GOAL =================
    const goalRes = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT TOP 1 *
        FROM UserWeeklyGoal
        WHERE UserId = @userId
        ORDER BY WeekStart DESC
      `);

    const goal = goalRes.recordset?.[0] || {};

    // ================= RESPONSE =================
    res.json({
      stats: {
        todayNew: todayData.learned,
        todayReview: todayData.reviewed,

        weekNew,
        weekReview,

        goalNew: goal.TargetNewWords || 60,
        goalReview: goal.TargetReview || 50,

        streak,
      },

      weeklyData,

      topik: {
        level12: total ? Math.round((level12 / total) * 100) : 0,
        level34: total ? Math.round((level34 / total) * 100) : 0,
      },

      weekGoal: {
        new: {
          current: weekNew,
          total: goal.TargetNewWords || 60,
        },
        review: {
          current: weekReview,
          total: goal.TargetReview || 50,
        },
        exercise: {
          current: goal.CurrentExercise || 0,
          total: goal.TargetExercise || 20,
        },
      },
    });
  } catch (err) {
    console.error("❌ Dashboard error:", err);
    res.status(500).json({ error: "server error" });
  }
};
