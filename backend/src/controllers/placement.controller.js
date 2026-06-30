const { pool, poolConnect, sql } = require("../config/db");

/* =========================
GET QUESTIONS
========================= */
exports.getQuestions = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await pool.request().query(`
      SELECT TOP 80
        Id,
        Question,
        OptionA,
        OptionB,
        OptionC,
        OptionD,
        CorrectAnswer,
        DifficultyLevel,
        Category,
        TopicId
      FROM TopikPlacementQuestions
      WHERE Category = 'Vocabulary'
      ORDER BY NEWID()
    `);

    return res.json({
      success: true,
      data: result.recordset || [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Không lấy được câu hỏi",
    });
  }
};

/* =========================
SUBMIT TEST
========================= */
exports.submitTest = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;
    const { answers } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const safeAnswers = answers || {};

    const result = await pool.request().query(`
      SELECT Id, CorrectAnswer
      FROM TopikPlacementQuestions
      WHERE Category = 'Vocabulary'
    `);

    const questions = result.recordset || [];

    let correct = 0;

    const normalize = (v) =>
      String(v || "")
        .trim()
        .toUpperCase();

    for (const q of questions) {
      const userAnswer = safeAnswers[q.Id];

      if (normalize(userAnswer) === normalize(q.CorrectAnswer)) {
        correct++;
      }
    }

    const total = questions.length;
    const score = total ? Math.round((correct / total) * 100) : 0;

    let level = 1;
    if (score >= 90) level = 6;
    else if (score >= 80) level = 5;
    else if (score >= 65) level = 4;
    else if (score >= 50) level = 3;
    else if (score >= 30) level = 2;

    const levelText = `VOCAB LEVEL ${level}`;

    const skillAnalysis = [
      {
        skill: "Vocabulary",
        score,
        status: score >= 80 ? "STRONG" : score >= 50 ? "AVERAGE" : "WEAK",
      },
    ];

    const roadmap = {
      sections:
        level <= 2
          ? [
              {
                title: "Basic Vocabulary",
                items: ["Gia đình", "Chào hỏi", "Trường học", "Đồ ăn"],
              },
            ]
          : level <= 4
            ? [
                {
                  title: "Intermediate Vocabulary",
                  items: ["Công việc", "Du lịch", "Sức khỏe", "Thời tiết"],
                },
              ]
            : [
                {
                  title: "Advanced Vocabulary",
                  items: ["Kinh tế", "Xã hội", "Công nghệ", "Chính trị"],
                },
              ],
    };

    return res.json({
      success: true,
      data: {
        score,
        correct,
        total,
        level,
        levelText,
        skillAnalysis,
        roadmap,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      detail: err.message,
    });
  }
};

/* =========================
GET RESULT
========================= */
exports.getResult = async (req, res) => {
  try {
    await poolConnect;

    const userId = req.user?.id;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT
          CurrentLevel,
          PlacementScore,
          PlacementTestDone,
          CreatedAt,
          UpdatedAt
        FROM UserTopikProfile
        WHERE UserId = @userId
      `);

    return res.json({
      success: true,
      data: result.recordset?.[0] || null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Không lấy được kết quả",
    });
  }
};
