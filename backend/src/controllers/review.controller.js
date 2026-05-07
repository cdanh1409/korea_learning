const { pool, poolConnect, sql } = require("../config/db");

/* ================= UTIL ================= */
const safeInt = (v) => (isNaN(Number(v)) ? 0 : Number(v));

/* ================= REVIEW WORDS ================= */
exports.getReviewWords = async (req, res) => {
  try {
    await poolConnect;

    const topicId = Number(req.query.topicId);
    const userId = req.user?.id;

    if (!topicId || !userId) {
      return res.status(400).json({ message: "Missing data" });
    }

    const result = await pool
      .request()
      .input("topicId", sql.Int, topicId)
      .input("userId", sql.Int, userId).query(`
        SELECT 
          v.*,
          ISNULL(p.CorrectCount,0) AS CorrectCount,
          ISNULL(p.WrongCount,0) AS WrongCount,
          p.NextReview,
          p.IsLearned,
          p.Repetition
        FROM Vocabulary v
        LEFT JOIN UserVocabularyProgress p
          ON p.VocabularyId = v.Id
          AND p.UserId = @userId
        WHERE v.TopicId = @topicId

        ORDER BY 
          CASE 
            WHEN p.NextReview IS NOT NULL AND p.NextReview <= GETDATE() THEN 0
            ELSE 1
          END,
          p.NextReview ASC,
          v.Id DESC
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error("getReviewWords error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/* ================= TODAY REVIEW ================= */
exports.getTodayReview = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await pool.request().input("userId", sql.Int, userId).query(`
      SELECT 
        v.*,
        p.NextReview,
        p.IsLearned
      FROM UserVocabularyProgress p
      JOIN Vocabulary v ON v.Id = p.VocabularyId
      WHERE p.UserId = @userId
        AND p.NextReview <= GETDATE()
      ORDER BY p.NextReview ASC
    `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error("getTodayReview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= NEW WORDS (FIXED LOGIC) ================= */
exports.getNewWords = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
      SELECT TOP 20 v.*
      FROM Vocabulary v
      WHERE NOT EXISTS (
        SELECT 1 
        FROM UserVocabularyProgress p
        WHERE p.VocabularyId = v.Id
          AND p.UserId = @userId
      )
      ORDER BY v.Id DESC
    `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error("getNewWords error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= STATS ================= */
exports.getStats = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
      SELECT 
        ISNULL(SUM(CorrectCount),0) AS correct,
        ISNULL(SUM(WrongCount),0) AS wrong
      FROM UserVocabularyProgress
      WHERE UserId = @userId
    `);

    const { correct, wrong } = result.recordset[0];

    const rate =
      correct + wrong === 0
        ? 0
        : Math.round((correct / (correct + wrong)) * 100);

    res.json({ rate, correct, wrong });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= STREAK (FIXED SAFE) ================= */
exports.getStreak = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
      SELECT DISTINCT CAST(LastReviewed AS DATE) AS d
      FROM UserVocabularyProgress
      WHERE UserId = @userId
        AND LastReviewed IS NOT NULL
      ORDER BY d DESC
    `);

    const dates = result.recordset.map(
      (r) => new Date(r.d).toISOString().split("T")[0],
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      d.setHours(0, 0, 0, 0);

      const diff = Math.floor((today - d) / 86400000);

      if (i === 0 && diff > 1) break;
      if (diff === i) streak++;
      else break;
    }

    res.json({ streak });
  } catch (err) {
    console.error("getStreak error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= TOPICS (FIXED LOGIC CLEAN) ================= */
exports.getTopics = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT 
          t.Id,
          t.Name,
          COUNT(v.Id) AS total,

          COUNT(p.VocabularyId) AS seen,

          SUM(CASE WHEN p.IsLearned = 1 THEN 1 ELSE 0 END) AS mastered

        FROM Topics t
        LEFT JOIN Vocabulary v ON v.TopicId = t.Id
        LEFT JOIN UserVocabularyProgress p 
          ON p.VocabularyId = v.Id AND p.UserId = @userId

        GROUP BY t.Id, t.Name
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= SRS UPDATE (FIXED CORE LOGIC) ================= */
exports.updateReview = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;
    const vocabId = Number(req.body.id);
    const level = req.body.level;

    if (!userId || !vocabId || !level) {
      return res.status(400).json({ message: "Missing data" });
    }

    const map = {
      again: { interval: 1, c: 0, w: 1 },
      hard: { interval: 2, c: 1, w: 0 },
      easy: { interval: 5, c: 1, w: 0 },
      skip: { interval: 0, c: 0, w: 0 },
    };

    const s = map[level] || map.hard;

    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("vocabId", sql.Int, vocabId)
      .input("c", sql.Int, s.c)
      .input("w", sql.Int, s.w)
      .input("interval", sql.Int, s.interval).query(`
        MERGE UserVocabularyProgress AS target
        USING (SELECT @userId AS UserId, @vocabId AS VocabularyId) AS src
        ON target.UserId = src.UserId AND target.VocabularyId = src.VocabularyId

        WHEN MATCHED THEN
          UPDATE SET
            CorrectCount = ISNULL(CorrectCount,0) + @c,
            WrongCount = ISNULL(WrongCount,0) + @w,
            Repetition = ISNULL(Repetition,0) + 1,
            IsLearned =
              CASE 
                WHEN Repetition >= 3 AND CorrectCount >= 3 THEN 1 
                ELSE IsLearned 
              END,
            LastReviewed = GETDATE(),
            NextReview = DATEADD(DAY, @interval, GETDATE())

        WHEN NOT MATCHED THEN
          INSERT (
            UserId, VocabularyId,
            CorrectCount, WrongCount,
            Repetition,
            IsLearned,
            LastReviewed, NextReview,
            CreatedAt
          )
          VALUES (
            @userId, @vocabId,
            @c, @w,
            1,
            0,
            GETDATE(),
            DATEADD(DAY, @interval, GETDATE()),
            GETDATE()
          );
      `);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
