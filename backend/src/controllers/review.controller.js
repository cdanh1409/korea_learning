const { pool, poolConnect, sql } = require("../config/db");

// ================= GET WORDS BY TOPIC =================
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
        SELECT v.*, p.*
        FROM Vocabulary v
        JOIN UserVocabularyProgress p 
          ON p.VocabularyId = v.Id AND p.UserId = @userId
        WHERE v.TopicId = @topicId
        ORDER BY ISNULL(p.NextReview, GETDATE()) ASC
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error("getReviewWords error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= TODAY REVIEW =================
exports.getTodayReview = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT v.*, p.*
        FROM UserVocabularyProgress p
        JOIN Vocabulary v ON v.Id = p.VocabularyId
        WHERE p.UserId = @userId
          AND p.NextReview IS NOT NULL
          AND p.NextReview <= GETDATE()
        ORDER BY p.NextReview ASC
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error("getTodayReview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= NEW WORDS =================
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

// ================= STATS =================
exports.getStats = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT 
          SUM(CorrectCount) AS totalCorrect,
          SUM(WrongCount) AS totalWrong
        FROM UserVocabularyProgress
        WHERE UserId = @userId
      `);

    const correct = result.recordset[0]?.totalCorrect || 0;
    const wrong = result.recordset[0]?.totalWrong || 0;

    const rate =
      correct + wrong === 0
        ? 0
        : Math.round((correct / (correct + wrong)) * 100);

    res.json({ rate });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= STREAK =================
exports.getStreak = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT DISTINCT CAST(LastReviewed AS DATE) AS reviewDate
        FROM UserVocabularyProgress
        WHERE UserId = @userId
        ORDER BY reviewDate DESC
      `);

    const dates = result.recordset.map(
      (r) => new Date(r.reviewDate).toISOString().split("T")[0],
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;

    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      d.setHours(0, 0, 0, 0);

      const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));

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

// ================= UPDATE REVIEW =================
exports.updateReview = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id || req.user?.userId;
    const vocabId = parseInt(req.body.id, 10);
    const type = req.body.level;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(vocabId) || !type) {
      return res.status(400).json({
        message: "Missing data",
        debug: { userId, vocabId, type },
      });
    }

    // ================= GET PROGRESS =================
    const progressRes = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("id", sql.Int, vocabId).query(`
        SELECT *
        FROM UserVocabularyProgress
        WHERE UserId = @userId AND VocabularyId = @id
      `);

    let row = progressRes.recordset[0];

    // ================= DEFAULT VALUES =================
    let repetition = row?.Repetition ?? 0;
    let interval = row?.IntervalDays ?? 0;
    let easeFactor = row?.EaseFactor ?? 2.5;
    let nextReview = new Date();
    let correctInc = 0;
    let wrongInc = 0;
    let isLearned = row?.IsLearned ?? 0;

    // ================= LOGIC =================
    switch (type) {
      case "again":
        repetition = 0;
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        wrongInc = 1;
        break;

      case "hard":
        repetition += 1;
        interval = Math.max(1, Math.floor(interval * 1.2));
        easeFactor = Math.max(1.3, easeFactor - 0.1);
        correctInc = 1;
        break;

      case "easy":
        repetition += 1;
        easeFactor = easeFactor + 0.1;
        interval = interval === 0 ? 1 : Math.floor(interval * easeFactor);
        correctInc = 1;
        break;

      case "skip":
        interval = 1;
        break;

      default:
        return res.status(400).json({ message: "Invalid type" });
    }

    // ================= NEXT REVIEW DATE =================
    nextReview.setDate(nextReview.getDate() + interval);

    // mark learned nếu repetition đủ cao
    if (repetition >= 5) isLearned = 1;

    // ================= UPSERT =================
    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("id", sql.Int, vocabId)
      .input("repetition", sql.Int, repetition)
      .input("intervalDays", sql.Int, interval)
      .input("easeFactor", sql.Float, easeFactor)
      .input("nextReview", sql.DateTime, nextReview)
      .input("correctInc", sql.Int, correctInc)
      .input("wrongInc", sql.Int, wrongInc)
      .input("isLearned", sql.Bit, isLearned).query(`
        IF EXISTS (
          SELECT 1
          FROM UserVocabularyProgress
          WHERE UserId = @userId AND VocabularyId = @id
        )
        BEGIN
          UPDATE UserVocabularyProgress
          SET
            LastReviewed = GETDATE(),
            NextReview = @nextReview,
            Repetition = @repetition,
            IntervalDays = @intervalDays,
            EaseFactor = @easeFactor,
            CorrectCount = CorrectCount + @correctInc,
            WrongCount = WrongCount + @wrongInc,
            IsLearned = @isLearned,
            IsActive = 1
          WHERE UserId = @userId AND VocabularyId = @id
        END
        ELSE
        BEGIN
          INSERT INTO UserVocabularyProgress
          (
            UserId,
            VocabularyId,
            CorrectCount,
            WrongCount,
            Repetition,
            IntervalDays,
            EaseFactor,
            LastReviewed,
            NextReview,
            CreatedAt,
            IsLearned,
            IsActive
          )
          VALUES
          (
            @userId,
            @id,
            @correctInc,
            @wrongInc,
            @repetition,
            @intervalDays,
            @easeFactor,
            GETDATE(),
            @nextReview,
            GETDATE(),
            @isLearned,
            1
          )
        END
      `);

    return res.json({ success: true });
  } catch (err) {
    console.error("updateReview error:", err);
    return res.status(500).json({
      message: "Server error",
      detail: err.message,
    });
  }
};
