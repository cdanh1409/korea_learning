function sm2({ repetition, interval, ef, quality }) {
  // ================= SAFETY =================
  const q = Math.max(0, Math.min(5, quality));

  ef = Math.max(1.3, Math.min(2.8, ef));

  // ================= FAIL (AGAIN) =================
  if (q <= 1) {
    return {
      repetition: 0,
      interval: 1,
      ef: Math.max(1.3, ef - 0.3), // slightly smoother penalty than before
    };
  }

  // ================= HARD =================
  if (q === 2) {
    return {
      repetition: Math.max(0, repetition - 1),
      interval: 1,
      ef: Math.max(1.3, ef - 0.15),
    };
  }

  // ================= SUCCESS =================
  repetition += 1;

  // ================= ANKI BASE INTERVALS =================
  if (repetition === 1) {
    interval = 1;
  } else if (repetition === 2) {
    interval = 6;
  } else {
    // 🔥 smoother growth (less exponential explosion)
    interval = Math.round(interval * ef);
  }

  // ================= EF UPDATE (ANKI CORE FIXED) =================
  const qualityFactor = (5 - q) * (0.08 + (5 - q) * 0.02);

  ef = ef + (0.1 - qualityFactor);

  // ================= CLAMP EF =================
  ef = Math.max(1.3, Math.min(2.8, ef));

  // ================= SAFETY CAPS =================
  interval = Math.min(interval, 36500);

  return {
    repetition,
    interval,
    ef,
  };
}

module.exports = sm2;
