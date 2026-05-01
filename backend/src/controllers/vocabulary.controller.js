const { pool, poolConnect, sql } = require("../config/db");

/* ================= GET TOPICS (FIXED - NO UNLEARNED TOPIC) ================= */
exports.getTopics = async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request().query(`
      SELECT 
        t.Id,
        t.Name,
        COUNT(v.Id) AS WordCount,
        MAX(v.Level) AS Level
      FROM Topics t
      JOIN Vocabulary v ON v.TopicId = t.Id
      GROUP BY t.Id, t.Name
    `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET VOCAB (ONLY USER PROGRESS VOCAB) ================= */
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
          p.CorrectCount,
          p.WrongCount,
          p.NextReview,
          p.IsLearned
        FROM Vocabulary v
        LEFT JOIN UserVocabularyProgress p 
          ON p.VocabularyId = v.Id
          AND p.UserId = @userId
        WHERE v.TopicId = @topicId
        ORDER BY v.Id
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DUE WORDS (SRS CORRECT) ================= */
exports.getDueWords = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
      SELECT v.*, p.*
      FROM Vocabulary v
      INNER JOIN UserVocabularyProgress p 
        ON v.Id = p.VocabularyId
      WHERE p.UserId = @userId
        AND p.NextReview IS NOT NULL
        AND p.NextReview <= GETDATE()
      ORDER BY p.NextReview ASC
    `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE REVIEW (SRS FIXED CORE) ================= */
exports.updateReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id, level } = req.body;

    if (!userId || !id || !level) {
      return res.status(400).json({ message: "Missing data" });
    }

    const vocabId = Number(id);

    const map = {
      again: { correct: 0, wrong: 1, interval: 0, learned: 0 },
      hard: { correct: 1, wrong: 0, interval: 1, learned: 0 },
      normal: { correct: 1, wrong: 0, interval: 3, learned: 1 },
      easy: { correct: 1, wrong: 0, interval: 7, learned: 1 },
    };

    const s = map[level] || map.normal;

    await poolConnect;

    // LOG
    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("vocabId", sql.Int, vocabId)
      .input("level", sql.NVarChar, level).query(`
        INSERT INTO UserVocabularyReviewLog
        (UserId, VocabularyId, Level, CreatedAt)
        VALUES (@userId, @vocabId, @level, GETDATE())
      `);

    // UPSERT
    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("vocabId", sql.Int, vocabId)
      .input("correct", sql.Int, s.correct)
      .input("wrong", sql.Int, s.wrong)
      .input("interval", sql.Int, s.interval)
      .input("learned", sql.Bit, s.learned).query(`
        MERGE UserVocabularyProgress AS target
        USING (SELECT @userId AS UserId, @vocabId AS VocabularyId) AS src
        ON target.UserId = src.UserId AND target.VocabularyId = src.VocabularyId

        WHEN MATCHED THEN
          UPDATE SET
            CorrectCount = ISNULL(CorrectCount,0) + @correct,
            WrongCount = ISNULL(WrongCount,0) + @wrong,
            Repetition = ISNULL(Repetition,0) + 1,
            IsLearned = CASE WHEN @learned = 1 THEN 1 ELSE IsLearned END,
            LastReviewed = GETDATE(),
            NextReview = DATEADD(DAY, @interval, GETDATE())

        WHEN NOT MATCHED THEN
          INSERT (
            UserId, VocabularyId, CorrectCount, WrongCount,
            Repetition, IntervalDays, EaseFactor, IsLearned,
            LastReviewed, NextReview, CreatedAt
          )
          VALUES (
            @userId, @vocabId, @correct, @wrong,
            1, @interval, 2.5, @learned,
            GETDATE(),
            DATEADD(DAY, @interval, GETDATE()),
            GETDATE()
          );
      `);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
};
