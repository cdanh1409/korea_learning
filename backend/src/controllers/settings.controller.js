const { pool, poolConnect, sql } = require("../config/db");

//////////////////////////////////////////////////
// CONFIG
//////////////////////////////////////////////////
const CURRENT_SETTINGS_VERSION = 1;

//////////////////////////////////////////////////
// WEEK START (UTC SAFE)
//////////////////////////////////////////////////
function getWeekStart() {
  const now = new Date();

  const utc = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  const day = utc.getUTCDay();
  const diff = utc.getUTCDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(utc);
  monday.setUTCDate(diff);
  monday.setUTCHours(0, 0, 0, 0);

  return monday;
}

//////////////////////////////////////////////////
// DEFAULT SETTINGS
//////////////////////////////////////////////////
const defaultSettings = {
  learning: {
    newCardsPerDay: 20,
    learningSteps: [1, 10],
    graduatingInterval: 1,
    easyInterval: 4,
  },

  review: {
    maxReviewsPerDay: 100,
    easyBonus: 1.3,
    intervalModifier: 1.0,
  },

  lapse: {
    relearningSteps: [1, 10],
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
// HELPERS
//////////////////////////////////////////////////
function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function safeNumber(value, fallback) {
  const n = Number(value);
  return isNaN(n) ? fallback : n;
}

/**
 * FIX BOOLEAN BUG:
 * "false" -> false
 * "true" -> true
 */
function safeBoolean(value, fallback = false) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

function normalizeSteps(value) {
  if (Array.isArray(value)) {
    return value.map(Number).filter((v) => !isNaN(v) && v > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(Number)
      .filter((v) => !isNaN(v) && v > 0);
  }

  return [1, 10];
}

//////////////////////////////////////////////////
// SANITIZE SETTINGS (CORE)
//////////////////////////////////////////////////
function sanitizeSettings(input = {}) {
  return {
    learning: {
      newCardsPerDay: clamp(
        safeNumber(input.learning?.newCardsPerDay, 20),
        1,
        999,
      ),

      learningSteps: normalizeSteps(input.learning?.learningSteps),

      graduatingInterval: clamp(
        safeNumber(input.learning?.graduatingInterval, 1),
        1,
        365,
      ),

      easyInterval: clamp(safeNumber(input.learning?.easyInterval, 4), 1, 365),
    },

    review: {
      maxReviewsPerDay: clamp(
        safeNumber(input.review?.maxReviewsPerDay, 100),
        1,
        9999,
      ),

      easyBonus: clamp(safeNumber(input.review?.easyBonus, 1.3), 1, 5),

      intervalModifier: clamp(
        safeNumber(input.review?.intervalModifier, 1),
        0.1,
        5,
      ),
    },

    lapse: {
      relearningSteps: normalizeSteps(input.lapse?.relearningSteps),

      lapseIntervalMultiplier: clamp(
        safeNumber(input.lapse?.lapseIntervalMultiplier, 0.5),
        0.1,
        1,
      ),

      minimumInterval: clamp(
        safeNumber(input.lapse?.minimumInterval, 1),
        1,
        365,
      ),
    },

    behavior: {
      showAnswerTimer: safeBoolean(input.behavior?.showAnswerTimer, true),
      autoFlip: safeBoolean(input.behavior?.autoFlip, false),
      allowSkip: safeBoolean(input.behavior?.allowSkip, true),
      burySiblings: safeBoolean(input.behavior?.burySiblings, true),
    },

    ui: {
      fontSize: clamp(safeNumber(input.ui?.fontSize, 16), 12, 40),

      animation: safeBoolean(input.ui?.animation, true),
      soundEffect: safeBoolean(input.ui?.soundEffect, true),
      darkMode: safeBoolean(input.ui?.darkMode, false),
    },

    notify: {
      enableReminder: safeBoolean(input.notify?.enableReminder, true),
      reminderHour: clamp(safeNumber(input.notify?.reminderHour, 20), 0, 23),
    },
  };
}

//////////////////////////////////////////////////
// USER ID
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

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("weekStart", sql.Date, weekStart).query(`
        SELECT TOP 1 *
        FROM UserSettings
        WHERE UserId = @userId
        AND WeekStart = @weekStart
      `);

    const row = result.recordset[0];

    let settings = defaultSettings;

    if (row?.SettingsJson) {
      try {
        const parsed = JSON.parse(row.SettingsJson);

        settings = sanitizeSettings(parsed);
      } catch {
        settings = defaultSettings;
      }
    }

    return res.json({
      id: row?.Id || null,
      userId,
      weekStart,
      version: row?.Version || 1,
      updatedAt: row?.UpdatedAt || null,
      settings,
    });
  } catch (err) {
    console.error("getSettings error:", err);

    if (err.message === "INVALID_USER") {
      return res.status(401).json({ message: "Invalid user" });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////
// SAVE SETTINGS
//////////////////////////////////////////////////
exports.saveSettings = async (req, res) => {
  try {
    await poolConnect;

    const userId = getUserId(req);
    const weekStart = getWeekStart();

    const input = req.body?.settings || req.body;

    const cleanSettings = sanitizeSettings(input);

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
          SELECT
            @userId AS UserId,
            @weekStart AS WeekStart
        ) AS source
        ON target.UserId = source.UserId
        AND target.WeekStart = source.WeekStart

        WHEN MATCHED THEN
          UPDATE SET
            SettingsJson = @settingsJson,
            UpdatedAt = GETDATE(),
            Version = ISNULL(target.Version, 1) + 1

        WHEN NOT MATCHED THEN
          INSERT (
            UserId,
            WeekStart,
            SettingsJson,
            Version,
            UpdatedAt
          )
          VALUES (
            @userId,
            @weekStart,
            @settingsJson,
            1,
            GETDATE()
          );
      `);

    return res.json({
      success: true,
      version: CURRENT_SETTINGS_VERSION,
      message: "Settings saved successfully",
    });
  } catch (err) {
    console.error("saveSettings error:", err);

    if (err.message === "INVALID_USER") {
      return res.status(401).json({ message: "Invalid user" });
    }

    return res.status(500).json({
      message: err.message || "Server error",
    });
  }
};
