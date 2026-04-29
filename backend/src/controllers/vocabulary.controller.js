const { pool, poolConnect } = require("../config/db");

// ================= GET TOPICS =================
exports.getTopics = async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request().query(`
      SELECT 
        t.Id,
        t.Name,
        COUNT(v.Id) AS WordCount,
        CASE 
          WHEN COUNT(v.Id) = 0 THEN 0
          WHEN COUNT(CASE WHEN v.Level >= 3 THEN 1 END) > 0 THEN 3
          WHEN COUNT(CASE WHEN v.Level = 2 THEN 1 END) > 0 THEN 2
          ELSE 1
        END AS Level
      FROM Topics t
      LEFT JOIN Vocabulary v ON t.Id = v.TopicId
      GROUP BY t.Id, t.Name;
    `);

    res.json(result.recordset || []);
  } catch (err) {
    console.log("GET TOPICS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET VOCABULARY =================
exports.getAllVocabulary = async (req, res) => {
  try {
    await poolConnect;

    const topicId = Number(req.query.topicId);

    if (!topicId || Number.isNaN(topicId)) {
      return res.status(400).json({ message: "topicId is invalid" });
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
        ORDER BY Id ASC
      `);

    res.json(result.recordset || []);
  } catch (err) {
    console.log("GET VOCAB ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET DUE WORDS (SRS) =================
exports.getDueWords = async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request().query(`
      SELECT *
      FROM Vocabulary
      WHERE nextReview IS NULL
         OR nextReview <= GETDATE()
      ORDER BY nextReview ASC
    `);

    res.json(result.recordset || []);
  } catch (err) {
    console.log("GET DUE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE REVIEW (SRS FIXED) =================
exports.updateReview = async (req, res) => {
  try {
    const { id, level } = req.body;

    if (!id || !level) {
      return res.status(400).json({ message: "Missing data" });
    }

    const wordId = Number(id);
    if (Number.isNaN(wordId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    // SRS interval
    const intervalMap = {
      hard: 1,
      normal: 3,
      easy: 7,
    };

    const days = intervalMap[level] ?? 1;

    await poolConnect;

    // FIX QUAN TRỌNG: luôn dựa vào "GETDATE()"
    await pool.request().input("id", wordId).input("days", days).query(`
        UPDATE Vocabulary
        SET 
          nextReview = DATEADD(DAY, @days, GETDATE())
        WHERE Id = @id
      `);

    res.json({
      success: true,
      id: wordId,
      level,
      addedDays: days,
    });
  } catch (err) {
    console.log("SRS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
