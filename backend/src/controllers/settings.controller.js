const { pool, poolConnect, sql } = require("../config/db");

//////////////////////////////////////////////////
// HELPER: GET WEEK START (MONDAY)
//////////////////////////////////////////////////
function getWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0 (CN) -> 6
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  return monday;
}

//////////////////////////////////////////////////
// GET SETTINGS
//////////////////////////////////////////////////
exports.getSettings = async (req, res) => {
  try {
    await poolConnect;

    const userId = 1;
    const weekStart = getWeekStart();

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("weekStart", sql.Date, weekStart).query(`
        SELECT TOP 1 *
        FROM UserWeeklyGoal
        WHERE UserId = @userId
        AND WeekStart = @weekStart
      `);

    const data = result.recordset[0];

    return res.json({
      weeklyNew: data?.TargetNewWords ?? 60,
      weeklyReview: data?.TargetReview ?? 50,
      weeklyExercise: data?.TargetExercise ?? 20,
    });
  } catch (err) {
    console.error("getSettings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////
// SAVE SETTINGS
//////////////////////////////////////////////////
exports.saveSettings = async (req, res) => {
  const transaction = new sql.Transaction(pool);

  try {
    await poolConnect;

    const userId = 1;
    const weekStart = getWeekStart();

    let { weeklyNew, weeklyReview, weeklyExercise } = req.body;

    // ===== VALIDATE =====
    weeklyNew = Math.max(0, Number(weeklyNew) || 0);
    weeklyReview = Math.max(0, Number(weeklyReview) || 0);
    weeklyExercise = Math.max(0, Number(weeklyExercise) || 0);

    await transaction.begin();

    const request = new sql.Request(transaction);

    await request
      .input("userId", sql.Int, userId)
      .input("weekStart", sql.Date, weekStart)
      .input("weeklyNew", sql.Int, weeklyNew)
      .input("weeklyReview", sql.Int, weeklyReview)
      .input("weeklyExercise", sql.Int, weeklyExercise).query(`
        IF EXISTS (
          SELECT 1 FROM UserWeeklyGoal
          WHERE UserId = @userId
          AND WeekStart = @weekStart
        )
        BEGIN
          UPDATE UserWeeklyGoal
          SET 
            TargetNewWords = @weeklyNew,
            TargetReview = @weeklyReview,
            TargetExercise = @weeklyExercise
          WHERE UserId = @userId
          AND WeekStart = @weekStart
        END
        ELSE
        BEGIN
          INSERT INTO UserWeeklyGoal
          (UserId, WeekStart, TargetNewWords, TargetReview, TargetExercise)
          VALUES
          (@userId, @weekStart, @weeklyNew, @weeklyReview, @weeklyExercise)
        END
      `);

    await transaction.commit();

    res.json({ success: true });
  } catch (err) {
    await transaction.rollback();
    console.error("saveSettings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
