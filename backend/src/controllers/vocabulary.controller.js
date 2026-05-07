const { pool, poolConnect, sql } = require("../config/db");
const sm2 = require("../utils/srs");

/* ================= QUALITY MAP ================= */
const LEVEL_TO_QUALITY = {
  again: 1,
  hard: 2,
  normal: 3,
  easy: 4,
  perfect: 5,
};

/* ================= GET TOPICS ================= */
exports.getTopics = async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request().query(`
      SELECT 
        t.Id,
        t.Name,
        t.Level,
        COUNT(v.Id) AS WordCount
      FROM Topics t
      LEFT JOIN Vocabulary v ON v.TopicId = t.Id
      GROUP BY t.Id, t.Name, t.Level
      ORDER BY t.Id
    `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET VOCAB ================= */
exports.getAllVocabulary = async (req, res) => {
  try {
    await poolConnect;

    const topicId = Number(req.query.topicId);
    const userId = req.user?.id;

    if (!topicId) {
      return res.status(400).json({ message: "topicId invalid" });
    }

    const result = await pool
      .request()
      .input("topicId", sql.Int, topicId)
      .input("userId", sql.Int, userId).query(`
        SELECT 
          v.Id,
          v.Word,
          v.Meaning,
          v.Pronunciation,
          v.AudioUrl,
          v.Level,
          v.TopicId,

          ISNULL(p.Repetition, 0) AS Repetition,
          ISNULL(p.IntervalDays, 0) AS IntervalDays,
          ISNULL(p.EaseFactor, 2.5) AS EaseFactor,
          p.NextReview,
          ISNULL(p.IsLearned, 0) AS IsLearned,
          ISNULL(p.IsActive, 1) AS IsActive
        FROM Vocabulary v
        LEFT JOIN UserVocabularyProgress p 
          ON p.VocabularyId = v.Id AND p.UserId = @userId
        WHERE v.TopicId = @topicId
        ORDER BY v.Id
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DUE WORDS ================= */
exports.getDueWords = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT 
          v.Id,
          v.Word,
          v.Meaning,
          v.Level,
          p.Repetition,
          p.IntervalDays,
          p.EaseFactor,
          p.NextReview,
          p.IsLearned
        FROM Vocabulary v
        INNER JOIN UserVocabularyProgress p 
          ON v.Id = p.VocabularyId
        WHERE p.UserId = @userId
          AND p.NextReview <= GETDATE()
          AND ISNULL(p.IsActive, 1) = 1
        ORDER BY p.NextReview ASC
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE REVIEW (FULL FIXED SRS CORE) ================= */
exports.updateReview = async (req, res) => {
  const transaction = new sql.Transaction(pool);

  try {
    await poolConnect;

    const userId = req.user?.id;
    const { id, level } = req.body;

    if (!userId || !id || !level) {
      return res.status(400).json({ message: "Missing data" });
    }

    const vocabId = Number(id);
    const quality = LEVEL_TO_QUALITY[level] ?? 3;

    await transaction.begin();

    // ================= GET CURRENT STATE =================
    const current = await new sql.Request(transaction)
      .input("userId", sql.Int, userId)
      .input("vocabId", sql.Int, vocabId).query(`
        SELECT Repetition, IntervalDays, EaseFactor
        FROM UserVocabularyProgress WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @userId AND VocabularyId = @vocabId
      `);

    const state = current.recordset[0] || {
      Repetition: 0,
      IntervalDays: 0,
      EaseFactor: 2.5,
    };

    // ================= SM2 =================
    const result = sm2({
      repetition: state.Repetition,
      interval: state.IntervalDays,
      ef: state.EaseFactor,
      quality,
    });

    // ================= SAFETY =================
    const repetition = Number.isFinite(result.repetition)
      ? result.repetition
      : 0;
    const interval = Number.isFinite(result.interval) ? result.interval : 1;
    const ef = Number.isFinite(result.ef) ? result.ef : 2.5;

    // ================= ANKI LOGIC =================
    const isLearned = interval >= 21 ? 1 : 0;

    const nextReview = new Date(Date.now() + interval * 86400000);

    // ================= UPSERT =================
    await new sql.Request(transaction)
      .input("userId", sql.Int, userId)
      .input("vocabId", sql.Int, vocabId)
      .input("repetition", sql.Int, repetition)
      .input("interval", sql.Int, interval)
      .input("ef", sql.Float, ef)
      .input("isLearned", sql.Bit, isLearned)
      .input("nextReview", sql.DateTime, nextReview).query(`
        IF EXISTS (
          SELECT 1 FROM UserVocabularyProgress
          WHERE UserId = @userId AND VocabularyId = @vocabId
        )
        UPDATE UserVocabularyProgress
        SET 
          Repetition = @repetition,
          IntervalDays = @interval,
          EaseFactor = @ef,
          IsLearned = @isLearned,
          LastReviewed = GETDATE(),
          NextReview = @nextReview
        WHERE UserId = @userId AND VocabularyId = @vocabId
        ELSE
        INSERT INTO UserVocabularyProgress (
          UserId, VocabularyId,
          Repetition, IntervalDays, EaseFactor,
          IsLearned,
          LastReviewed, NextReview, CreatedAt
        )
        VALUES (
          @userId, @vocabId,
          @repetition, @interval, @ef,
          @isLearned,
          GETDATE(), @nextReview, GETDATE()
        )
      `);

    // ================= LOG =================
    await new sql.Request(transaction)
      .input("userId", sql.Int, userId)
      .input("vocabId", sql.Int, vocabId)
      .input("level", sql.NVarChar, level).query(`
        INSERT INTO UserVocabularyReviewLog (
          UserId, VocabularyId, Level, CreatedAt
        )
        VALUES (
          @userId, @vocabId, @level, GETDATE()
        )
      `);

    await transaction.commit();

    return res.json({
      success: true,
      repetition,
      interval,
      ef,
      isLearned,
      nextReview,
    });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
    } catch (_) {}
    return res.status(500).json({ message: "server error" });
  }
};
