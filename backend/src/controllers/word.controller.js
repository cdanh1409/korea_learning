const { pool, poolConnect, sql } = require("../config/db");

exports.getWords = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id || req.user;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
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

    uv.LastReviewed,

    CASE 
        WHEN uv.Id IS NULL THEN 0
        ELSE 1
    END AS IsLearned,

    ISNULL(uv.CorrectCount, 0) AS CorrectCount,
    ISNULL(uv.WrongCount, 0) AS WrongCount,
    ISNULL(uv.Repetition, 0) AS Repetition,
    ISNULL(uv.IntervalDays, 0) AS IntervalDays,
    ISNULL(uv.EaseFactor, 2.5) AS EaseFactor,

    ve.ExampleSentence,
    ve.ExampleMeaning

FROM dbo.Vocabulary v

LEFT JOIN dbo.Topics t
    ON t.Id = v.TopicId

OUTER APPLY (
    SELECT TOP 1 *
    FROM dbo.UserVocabularyProgress uv
    WHERE uv.VocabularyId = v.Id
      AND uv.UserId = @userId
    ORDER BY uv.LastReviewed DESC, uv.Id DESC
) uv

OUTER APPLY (
    SELECT TOP 1
        ve.ExampleSentence,
        ve.ExampleMeaning
    FROM VocabularyExamples ve
    WHERE ve.VocabularyId = v.Id
    ORDER BY ve.Id DESC
) ve

ORDER BY v.Id DESC
`);

    res.json(result.recordset);
  } catch (err) {
    console.error("GET WORDS ERROR:", err);

    res.status(500).json({
      error: "Không lấy được danh sách từ",
      detail: err.message,
    });
  }
};

