const { pool, poolConnect, sql } = require("../config/db");

/* ================= GET WORDS (PAGINATION SAFE) ================= */
exports.getWords = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id || req.user;

    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const pageSize = Math.min(parseInt(req.query.pageSize || "20"), 100);
    const offset = (page - 1) * pageSize;

    const search = req.query.search?.trim() || "";
    const topic = req.query.topic || "all";
    const level = req.query.level || "all";

    const request = pool
      .request()
      .input("userId", sql.Int, userId)
      .input("offset", sql.Int, offset)
      .input("pageSize", sql.Int, pageSize)
      .input("search", sql.NVarChar, `%${search}%`);

    let where = `WHERE 1=1`;

    // SEARCH
    if (search) {
      where += `
        AND (
          v.Word LIKE @search
          OR v.Meaning LIKE @search
        )
      `;
    }

    // TOPIC
    if (topic && topic !== "all") {
      where += ` AND t.Name = @topic`;
      request.input("topic", sql.NVarChar, topic);
    }

    // LEVEL
    if (level && level !== "all") {
      const levelMap = {
        "Sơ cấp": 1,
        "Sơ trung": 2,
        "Trung cấp": 3,
        "Cao cấp": 4,
      };

      where += ` AND v.Level = @level`;
      request.input("level", sql.Int, levelMap[level] || 1);
    }

    // DATA QUERY
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

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM dbo.Vocabulary v
      LEFT JOIN dbo.Topics t ON t.Id = v.TopicId
      ${where};
    `;

    const [dataResult, countResult] = await Promise.all([
      request.query(dataQuery),
      pool
        .request()
        .input("userId", sql.Int, userId)
        .input("search", sql.NVarChar, `%${search}%`)
        .input("topic", sql.NVarChar, topic !== "all" ? topic : null)
        .input("level", sql.Int, null)
        .query(countQuery),
    ]);

    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      data: dataResult.recordset,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
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
