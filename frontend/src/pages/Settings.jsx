import { useEffect, useMemo, useState } from "react";
import Card from "../components/common/Card";
import useTheme from "../hooks/useTheme";
import api from "../utils/api";

/* ================= DEFAULT ================= */
const defaultSettings = {
  learning: {
    newCardsPerDay: 20,
    learningSteps: "1,10",
    graduatingInterval: 1,
    easyInterval: 4,
  },
  review: {
    maxReviewsPerDay: 100,
    easyBonus: 1.3,
    intervalModifier: 1.0,
  },
  lapse: {
    relearningSteps: "1,10",
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

/* ================= DEEP MERGE ================= */
function deepMerge(target, source) {
  if (!source) return target;
  const output = structuredClone(target);

  for (const key in source) {
    const sv = source[key];
    const tv = output[key];

    if (sv && typeof sv === "object" && !Array.isArray(sv)) {
      output[key] = deepMerge(tv || {}, sv);
    } else {
      output[key] = sv;
    }
  }
  return output;
}

/* ================= INIT ================= */
function getInitialSettings() {
  try {
    const cached = localStorage.getItem("settings");
    if (!cached) return defaultSettings;

    const parsed = JSON.parse(cached);
    return deepMerge(defaultSettings, parsed);
  } catch {
    return defaultSettings;
  }
}

export default function Settings() {
  const { darkMode, toggleTheme } = useTheme();

  const [tab, setTab] = useState("learning");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [settings, setSettings] = useState(getInitialSettings);

  const tabs = useMemo(
    () => [
      { key: "learning", label: "Learning" },
      { key: "review", label: "Review" },
      { key: "lapse", label: "Lapse" },
      { key: "behavior", label: "Behavior" },
      { key: "ui", label: "UI" },
      { key: "notify", label: "Notify" },
    ],
    [],
  );

  /* ================= LOAD ================= */
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const res = await api.get("/settings");

        if (ignore) return;

        setSettings((prev) => {
          const merged = deepMerge(prev, res.data || {});
          localStorage.setItem("settings", JSON.stringify(merged));
          return merged;
        });
      } catch {
        setMsg("❌ Load failed");
      }
    };

    load();
    return () => (ignore = true);
  }, []);

  /* ================= UPDATE ================= */
  const update = (group, key, value) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        [group]: {
          ...(prev[group] || {}),
          [key]: value,
        },
      };

      localStorage.setItem("settings", JSON.stringify(updated));
      return updated;
    });
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    setSaving(true);
    setMsg("");

    try {
      await api.post("/settings", settings);
      setMsg("✅ Saved successfully");
    } catch {
      setMsg("❌ Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ================= RESET ================= */
  const handleReset = () => {
    const fresh = structuredClone(defaultSettings);
    setSettings(fresh);
    localStorage.setItem("settings", JSON.stringify(fresh));
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 hidden md:flex flex-col border-r border-white/10 p-4 gap-2">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>

        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="text-left px-4 py-2 rounded-xl transition-all"
            style={{
              background: tab === t.key ? "var(--primary)" : "transparent",
              color: tab === t.key ? "#fff" : "var(--text)",
            }}
          >
            {t.label}
          </button>
        ))}

        <div className="mt-auto">
          <button
            className="w-full py-2 rounded-xl"
            style={{ background: "var(--card)" }}
            onClick={toggleTheme}
          >
            {darkMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-6 space-y-6">
        <div className="md:hidden flex justify-between items-center">
          <h1 className="text-2xl font-bold">Settings</h1>
          <button className="btn" onClick={toggleTheme}>
            Theme
          </button>
        </div>

        {/* MOBILE TABS */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-full text-sm whitespace-nowrap"
              style={{
                background: tab === t.key ? "var(--primary)" : "var(--card)",
                color: tab === t.key ? "#fff" : "var(--text)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {msg && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            {msg}
          </div>
        )}

        {/* CONTENT */}
        <div className="grid gap-6">
          {tab === "learning" && (
            <Card className="p-5 space-y-4">
              <h2 className="font-semibold text-lg">Learning</h2>

              <Input
                label="New cards/day"
                value={settings.learning.newCardsPerDay}
                onChange={(v) =>
                  update("learning", "newCardsPerDay", Number(v))
                }
              />

              <Input
                label="Learning steps"
                value={settings.learning.learningSteps}
                onChange={(v) => update("learning", "learningSteps", v)}
              />
            </Card>
          )}

          {tab === "review" && (
            <Card className="p-5 space-y-4">
              <h2 className="font-semibold text-lg">Review</h2>

              <Input
                label="Max reviews/day"
                value={settings.review.maxReviewsPerDay}
                onChange={(v) =>
                  update("review", "maxReviewsPerDay", Number(v))
                }
              />

              <Input
                label="Easy bonus"
                value={settings.review.easyBonus}
                onChange={(v) => update("review", "easyBonus", Number(v))}
              />
            </Card>
          )}

          {tab === "behavior" && (
            <Card className="p-5 space-y-4">
              <h2 className="font-semibold text-lg">Behavior</h2>

              <Toggle
                label="Auto flip"
                value={settings.behavior.autoFlip}
                onChange={(v) => update("behavior", "autoFlip", v)}
              />

              <Toggle
                label="Allow skip"
                value={settings.behavior.allowSkip}
                onChange={(v) => update("behavior", "allowSkip", v)}
              />
            </Card>
          )}

          {tab === "ui" && (
            <Card className="p-5 space-y-4">
              <h2 className="font-semibold text-lg">UI</h2>

              <Input
                label="Font size"
                value={settings.ui.fontSize}
                onChange={(v) => update("ui", "fontSize", Number(v))}
              />

              <Toggle
                label="Animation"
                value={settings.ui.animation}
                onChange={(v) => update("ui", "animation", v)}
              />
            </Card>
          )}
        </div>

        {/* ACTION */}
        <div className="sticky bottom-0 pt-4 bg-[var(--bg)] flex gap-3">
          <button
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: "var(--primary)" }}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "💾 Save changes"}
          </button>

          <button
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: "#ef4444" }}
            onClick={handleReset}
          >
            ♻ Reset
          </button>
        </div>
      </main>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function Input({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded-xl border outline-none"
        style={{
          borderColor: "var(--border)",
          background: "var(--card)",
        }}
      />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-12 h-6 rounded-full p-1 flex items-center transition-all"
        style={{
          background: value ? "var(--primary)" : "var(--card2)",
        }}
      >
        <div
          className="w-4 h-4 bg-white rounded-full transition-all"
          style={{
            transform: value ? "translateX(20px)" : "translateX(0)",
          }}
        />
      </button>
    </div>
  );
}
