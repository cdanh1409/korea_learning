const { pool, poolConnect, sql } = require("../config/db");

/* ================= GET WORDS (PAGINATION SAFE + FIXED FULL) ================= */
exports.getWords = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id || req.user;

    /* ================= PAGINATION ================= */
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const pageSize = Math.min(parseInt(req.query.pageSize || "20"), 100);
    const offset = (page - 1) * pageSize;

    /* ================= FILTERS ================= */
    const search = (req.query.search || "").trim();
    const topicRaw = (req.query.topic || "all").trim();
    const levelRaw = (req.query.level || "all").trim();

    const requestData = pool
      .request()
      .input("userId", sql.Int, userId)
      .input("offset", sql.Int, offset)
      .input("pageSize", sql.Int, pageSize);

    let where = `WHERE 1=1`;

    /* ================= SEARCH ================= */
    if (search) {
      requestData.input("search", sql.NVarChar, `%${search}%`);
      where += `
        AND (
          v.Word LIKE @search
          OR v.Meaning LIKE @search
        )
      `;
    }

    /* ================= TOPIC ================= */
    if (topicRaw !== "all") {
      requestData.input("topic", sql.NVarChar, topicRaw);
      where += `
        AND LTRIM(RTRIM(t.Name)) = @topic
      `;
    }

    /* ================= LEVEL ================= */
    if (levelRaw !== "all") {
      const levelMap = {
        "sơ cấp": 1,
        "sơ trung": 2,
        "trung cấp": 3,
        "cao cấp": 4,
      };

      const levelValue = levelMap[levelRaw.toLowerCase()] || null;

      if (levelValue) {
        requestData.input("level", sql.Int, levelValue);
        where += ` AND v.Level = @level`;
      }
    }

    /* ================= MAIN DATA QUERY ================= */
    const dataQuery = `
      SELECT
          v.Id,
          v.Word,
          v.Pronunciation,
          v.Meaning,
          t.Name AS TopicName,

          CASE v.Level
              WHEN 1 THEN N'Sơ cấp'
              WHEN 2 THEN N'Sơ trung'
              WHEN 3 THEN N'Trung cấp'
              ELSE N'Cao cấp'
          END AS LevelName,

          uv.LastReviewed AS LastReviewDate,
          CASE WHEN uv.VocabularyId IS NULL THEN 0 ELSE 1 END AS IsLearned,

          ISNULL(uv.Repetition, 0) AS Repetition,
          ISNULL(uv.IntervalDays, 0) AS IntervalDays,

          ISNULL(un.Note, '') AS Note,

          ve.ExampleSentence,
          ve.ExampleMeaning

      FROM dbo.Vocabulary v
      LEFT JOIN dbo.Topics t ON t.Id = v.TopicId
      LEFT JOIN dbo.UserVocabularyNotes un
          ON un.UserId = @userId AND un.VocabularyId = v.Id
      LEFT JOIN dbo.UserVocabularyProgress uv
          ON uv.UserId = @userId AND uv.VocabularyId = v.Id

      OUTER APPLY (
          SELECT TOP 1
              ve.ExampleSentence,
              ve.ExampleMeaning
          FROM dbo.VocabularyExamples ve
          WHERE ve.VocabularyId = v.Id
          ORDER BY ve.Id DESC
      ) ve

      ${where}
      ORDER BY v.Id DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `;

    /* ================= COUNT QUERY (FIXED FULL JOIN CONSISTENT) ================= */
    const countRequest = pool.request().input("userId", sql.Int, userId);

    if (search) {
      countRequest.input("search", sql.NVarChar, `%${search}%`);
    }

    if (topicRaw !== "all") {
      countRequest.input("topic", sql.NVarChar, topicRaw);
    }

    if (levelRaw !== "all") {
      const levelMap = {
        "sơ cấp": 1,
        "sơ trung": 2,
        "trung cấp": 3,
        "cao cấp": 4,
      };

      const levelValue = levelMap[levelRaw.toLowerCase()] || null;

      if (levelValue) {
        countRequest.input("level", sql.Int, levelValue);
      }
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM dbo.Vocabulary v
      LEFT JOIN dbo.Topics t ON t.Id = v.TopicId
      LEFT JOIN dbo.UserVocabularyNotes un
          ON un.UserId = @userId AND un.VocabularyId = v.Id
      LEFT JOIN dbo.UserVocabularyProgress uv
          ON uv.UserId = @userId AND uv.VocabularyId = v.Id
      ${where};
    `;

    /* ================= EXECUTE ================= */
    const [dataResult, countResult] = await Promise.all([
      requestData.query(dataQuery),
      countRequest.query(countQuery),
    ]);

    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / pageSize);

    /* ================= RESPONSE ================= */
    res.json({
      success: true,
      data: dataResult.recordset,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("GET WORDS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Không lấy được danh sách từ",
      detail: err.message,
    });
  }
};

/* ================= UPDATE NOTE (SAFE) ================= */
exports.updateWordNote = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id || req.user;
    const vocabularyId = Number(req.params.id);
    const note = req.body?.note ?? "";

    if (!userId || !vocabularyId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId or vocabularyId",
      });
    }

    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("VocabularyId", sql.Int, vocabularyId)
      .input("Note", sql.NVarChar(sql.MAX), note).query(`
        MERGE dbo.UserVocabularyNotes AS target
        USING (
            SELECT @UserId AS UserId, @VocabularyId AS VocabularyId
        ) AS source
        ON target.UserId = source.UserId
        AND target.VocabularyId = source.VocabularyId

        WHEN MATCHED THEN
            UPDATE SET
                Note = @Note,
                UpdatedAt = GETDATE()

        WHEN NOT MATCHED THEN
            INSERT (UserId, VocabularyId, Note, CreatedAt, UpdatedAt)
            VALUES (@UserId, @VocabularyId, @Note, GETDATE(), GETDATE());
      `);

    res.json({
      success: true,
      message: "Note saved",
    });
  } catch (err) {
    console.error("UPDATE NOTE ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Không lưu được ghi chú",
      detail: err.message,
    });
  }
};
exports.getAllTopics = async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request().query(`
      SELECT DISTINCT t.Name
      FROM dbo.Topics t
      ORDER BY t.Name
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    console.error("GET TOPICS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Không lấy được topics",
      detail: err.message,
    });
  }
};
