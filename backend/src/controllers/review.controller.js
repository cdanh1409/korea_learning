const { pool, poolConnect } = require("../config/db");

// ================= GET WORDS BY TOPIC =================
exports.getReviewWords = async (req, res) => {
  try {
    await poolConnect;

    const topicId = req.query.topicId;

    if (!topicId) {
      return res.status(400).json({ message: "Missing topicId" });
    }

    const result = await pool.request().input("topicId", topicId).query(`
      SELECT 
        Id,
        Word,
        Meaning,
        Pronunciation,
        AudioUrl,
        Level,
        TopicId,
        nextReview
      FROM Vocabulary
      WHERE TopicId = @topicId
      ORDER BY nextReview ASC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("getReviewWords error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET TODAY REVIEW =================
exports.getTodayReview = async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request().query(`
      SELECT *
      FROM Vocabulary
      WHERE nextReview <= GETDATE()
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("getTodayReview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET MEMORY STATS =================
exports.getStats = async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request().query(`
      SELECT 
        SUM(correctCount) AS totalCorrect,
        SUM(wrongCount) AS totalWrong
      FROM Vocabulary
    `);

    const correct = result.recordset[0].totalCorrect || 0;
    const wrong = result.recordset[0].totalWrong || 0;

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

// ================= GET STREAK =================
exports.getStreak = async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request().query(`
      SELECT DISTINCT CAST(LastReviewed AS DATE) AS reviewDate
      FROM UserVocabularyProgress
      WHERE UserId = 1
      ORDER BY reviewDate DESC
    `);

    const dates = result.recordset.map(
      (r) => r.reviewDate.toISOString().split("T")[0],
    );

    const today = new Date().toISOString().split("T")[0];

    let streak = 0;

    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const t = new Date(today);

      const diff = Math.floor((t - d) / (1000 * 60 * 60 * 24));

      if (i === 0 && diff > 1) break;

      if (diff === i) streak++;
      else break;
    }

    res.json({ streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE REVIEW =================
exports.updateReview = async (req, res) => {
  try {
    await poolConnect;

    const { id } = req.params;
    const { type } = req.body;

    // ===== GET CURRENT LEVEL =====
    const current = await pool.request().input("id", id).query(`
      SELECT Level FROM Vocabulary WHERE Id = @id
    `);

    if (!current.recordset.length) {
      return res.status(404).json({ message: "Word not found" });
    }

    let level = current.recordset[0].Level || 1;
    let nextReview = new Date();

    let correctInc = 0;
    let wrongInc = 0;

    // ===== SRS LOGIC =====
    if (type === "again") {
      level = Math.max(1, level - 1);
      nextReview.setMinutes(nextReview.getMinutes() + 10);
      wrongInc = 1;
    } else if (type === "good") {
      level += 1;

      const intervals = [1, 3, 7, 14, 30];
      const days = intervals[Math.min(level - 1, intervals.length - 1)];

      nextReview.setDate(nextReview.getDate() + days);
      correctInc = 1;
    } else if (type === "skip") {
      nextReview.setMinutes(nextReview.getMinutes() + 5);
    }

    // ===== UPDATE VOCABULARY =====
    await pool
      .request()
      .input("id", id)
      .input("level", level)
      .input("nextReview", nextReview)
      .input("correctInc", correctInc)
      .input("wrongInc", wrongInc).query(`
        UPDATE Vocabulary
        SET 
          Level = @level,
          nextReview = @nextReview,
          correctCount = ISNULL(correctCount,0) + @correctInc,
          wrongCount = ISNULL(wrongCount,0) + @wrongInc
        WHERE Id = @id
      `);

    // ===== UPDATE USER PROGRESS (STREAK) =====
    await pool.request().input("id", id).query(`
      IF EXISTS (
        SELECT 1 FROM UserVocabularyProgress 
        WHERE VocabularyId = @id AND UserId = 1
      )
      BEGIN
        UPDATE UserVocabularyProgress
        SET 
          LastReviewed = GETDATE(),
          CorrectCount = ISNULL(CorrectCount,0) + ${correctInc},
          WrongCount = ISNULL(WrongCount,0) + ${wrongInc}
        WHERE VocabularyId = @id AND UserId = 1
      END
      ELSE
      BEGIN
        INSERT INTO UserVocabularyProgress
        (UserId, VocabularyId, CorrectCount, WrongCount, LastReviewed, CreatedAt)
        VALUES (1, @id, ${correctInc}, ${wrongInc}, GETDATE(), GETDATE())
      END
    `);

    res.json({ success: true });
  } catch (err) {
    console.error("updateReview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
