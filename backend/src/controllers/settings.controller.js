const { pool, poolConnect, sql } = require("../config/db");

//////////////////////////////////////////////////
// WEEK START (MONDAY SAFE + STABLE)
//////////////////////////////////////////////////
function getWeekStart() {
  const now = new Date();

  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

//////////////////////////////////////////////////
// DEFAULT SETTINGS
//////////////////////////////////////////////////
const defaultSettings = {
  learning: {
    newCardsPerDay: 20,
    learningSteps: [1, 10], // 🔥 FIXED: array
    graduatingInterval: 1,
    easyInterval: 4,
  },
  review: {
    maxReviewsPerDay: 100,
    easyBonus: 1.3,
    intervalModifier: 1.0,
  },
  lapse: {
    relearningSteps: [1, 10], // 🔥 FIXED
    lapseIntervalMultiplier: 0.5,
    minimumInterval: 1,
  },
  behavior: {
    showAnswerTimer: true,
    autoFlip: false,
    allowSkip: true,
    burySiblings: true,
  },
  ui: {
    fontSize: 16,
    animation: true,
    soundEffect: true,
    darkMode: false,
  },
  notify: {
    enableReminder: true,
    reminderHour: 20,
  },
};

//////////////////////////////////////////////////
// NORMALIZE STEPS (CRITICAL FIX)
//////////////////////////////////////////////////
function normalizeSteps(value) {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === "string") {
    return value.split(",").map(Number).filter(Boolean);
  }
  return [1, 10];
}

//////////////////////////////////////////////////
// SANITIZE SETTINGS (STRICT TYPE SAFE)
//////////////////////////////////////////////////
function sanitizeSettings(input = {}) {
  return {
    learning: {
      newCardsPerDay: Number(input.learning?.newCardsPerDay ?? 20),
      learningSteps: normalizeSteps(input.learning?.learningSteps),
      graduatingInterval: Number(input.learning?.graduatingInterval ?? 1),
      easyInterval: Number(input.learning?.easyInterval ?? 4),
    },
    review: {
      maxReviewsPerDay: Number(input.review?.maxReviewsPerDay ?? 100),
      easyBonus: Number(input.review?.easyBonus ?? 1.3),
      intervalModifier: Number(input.review?.intervalModifier ?? 1),
    },
    lapse: {
      relearningSteps: normalizeSteps(input.lapse?.relearningSteps),
      lapseIntervalMultiplier: Number(
        input.lapse?.lapseIntervalMultiplier ?? 0.5,
      ),
      minimumInterval: Number(input.lapse?.minimumInterval ?? 1),
    },
    behavior: {
      showAnswerTimer: Boolean(input.behavior?.showAnswerTimer ?? true),
      autoFlip: Boolean(input.behavior?.autoFlip ?? false),
      allowSkip: Boolean(input.behavior?.allowSkip ?? true),
      burySiblings: Boolean(input.behavior?.burySiblings ?? true),
    },
    ui: {
      fontSize: Number(input.ui?.fontSize ?? 16),
      animation: Boolean(input.ui?.animation ?? true),
      soundEffect: Boolean(input.ui?.soundEffect ?? true),
      darkMode: Boolean(input.ui?.darkMode ?? false),
    },
    notify: {
      enableReminder: Boolean(input.notify?.enableReminder ?? true),
      reminderHour: Number(input.notify?.reminderHour ?? 20),
    },
  };
}

//////////////////////////////////////////////////
// SAFE USER EXTRACT
//////////////////////////////////////////////////
function getUserId(req) {
  const userId = Number(req.user?.id);

  if (!userId || isNaN(userId)) {
    throw new Error("INVALID_USER");
  }

  return userId;
}

//////////////////////////////////////////////////
// GET SETTINGS
//////////////////////////////////////////////////
exports.getSettings = async (req, res) => {
  try {
    await poolConnect;

    const userId = getUserId(req);
    const weekStart = getWeekStart();

    console.log("🔥 GET SETTINGS USER:", userId);

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("weekStart", sql.Date, weekStart).query(`
        SELECT TOP 1 SettingsJson
        FROM UserSettings
        WHERE UserId = @userId
          AND WeekStart = @weekStart
      `);

    const row = result.recordset[0];

    const settings = row?.SettingsJson
      ? sanitizeSettings(JSON.parse(row.SettingsJson))
      : defaultSettings;

    return res.json(settings);
  } catch (err) {
    console.error("getSettings error:", err);

    if (err.message === "INVALID_USER") {
      return res.status(401).json({ message: "Invalid user" });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////
// SAVE SETTINGS (UPSERT CLEAN)
//////////////////////////////////////////////////
exports.saveSettings = async (req, res) => {
  try {
    await poolConnect;

    const userId = getUserId(req);
    const weekStart = getWeekStart();

    const cleanSettings = sanitizeSettings(req.body);

    console.log("🔥 SAVE SETTINGS USER:", userId);

    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("weekStart", sql.Date, weekStart)
      .input(
        "settingsJson",
        sql.NVarChar(sql.MAX),
        JSON.stringify(cleanSettings),
      ).query(`
        MERGE UserSettings AS target
        USING (
          SELECT @userId AS UserId, @weekStart AS WeekStart
        ) AS source
        ON target.UserId = source.UserId
        AND target.WeekStart = source.WeekStart

        WHEN MATCHED THEN
          UPDATE SET
            SettingsJson = @settingsJson,
            UpdatedAt = GETDATE(),
            Version = ISNULL(Version, 1) + 1

        WHEN NOT MATCHED THEN
          INSERT (UserId, WeekStart, SettingsJson, Version)
          VALUES (@userId, @weekStart, @settingsJson, 1);
      `);

    return res.json({
      success: true,
      userId,
    });
  } catch (err) {
    console.error("saveSettings error:", err);

    if (err.message === "INVALID_USER") {
      return res.status(401).json({ message: "Invalid user" });
    }

    return res.status(500).json({ message: "Server error" });
  }
};
