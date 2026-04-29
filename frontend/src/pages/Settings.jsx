import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import useTheme from "../hooks/useTheme";

const defaultSettings = {
  dailyNew: 20,
  showImageFirst: true,
  autoPlayAudio: true,

  dailyReview: 50,
  easyInterval: 3,
  mediumInterval: 1,

  fontSize: 16,
  reminderHour: 20,
};

export default function Settings() {
  const [tab, setTab] = useState("learning");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const { darkMode, toggleTheme } = useTheme();

  const [settings, setSettings] = useState(() => {
    const cached = localStorage.getItem("settings");
    return cached ? JSON.parse(cached) : defaultSettings;
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const merged = { ...settings, ...data };
        setSettings(merged);
        localStorage.setItem("settings", JSON.stringify(merged));
      })
      .catch(() => setMsg("❌ Không tải được settings"));
  }, []);

  const update = (key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("settings", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");

    try {
      const res = await fetch("http://localhost:5000/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error();
      setMsg("✅ Saved successfully");
    } catch {
      setMsg("❌ Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen px-6 py-8 space-y-6"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">⚙️ Settings</h1>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-xl text-sm font-medium transition"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {darkMode ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      {/* SEGMENTED TAB (xịn hơn button thường) */}
      <div
        className="flex p-1 rounded-2xl w-fit"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        {["learning", "review", "ui", "notification"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition"
            style={{
              background: tab === t ? "var(--primary)" : "transparent",
              color: tab === t ? "white" : "var(--muted)",
              transform: tab === t ? "scale(1.02)" : "scale(1)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* MESSAGE (toast style nhẹ hơn) */}
      {msg && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {msg}
        </div>
      )}

      {/* GRID LAYOUT (look pro hơn stacked UI) */}
      <div className="grid gap-6">
        {/* ================= LEARNING ================= */}
        {tab === "learning" && (
          <Card>
            <SectionTitle title="🧠 Learning Preferences" />

            <Grid>
              <Input
                label="Daily new words"
                value={settings.dailyNew}
                onChange={(v) => update("dailyNew", Number(v))}
              />

              <Toggle
                label="Show image first"
                value={settings.showImageFirst}
                onChange={(v) => update("showImageFirst", v)}
              />

              <Toggle
                label="Auto play audio"
                value={settings.autoPlayAudio}
                onChange={(v) => update("autoPlayAudio", v)}
              />
            </Grid>
          </Card>
        )}

        {/* ================= REVIEW ================= */}
        {tab === "review" && (
          <Card>
            <SectionTitle title="🔁 Spaced Repetition" />

            <Grid>
              <Input
                label="Daily reviews"
                value={settings.dailyReview}
                onChange={(v) => update("dailyReview", Number(v))}
              />

              <Input
                label="Easy interval"
                value={settings.easyInterval}
                onChange={(v) => update("easyInterval", Number(v))}
              />

              <Input
                label="Medium interval"
                value={settings.mediumInterval}
                onChange={(v) => update("mediumInterval", Number(v))}
              />
            </Grid>
          </Card>
        )}

        {/* ================= UI ================= */}
        {tab === "ui" && (
          <Card>
            <SectionTitle title="🎨 Interface" />

            <Grid>
              <Toggle
                label="Dark mode"
                value={darkMode}
                onChange={toggleTheme}
              />

              <Input
                label="Font size"
                value={settings.fontSize}
                onChange={(v) => update("fontSize", Number(v))}
              />
            </Grid>
          </Card>
        )}

        {/* ================= NOTIFICATION ================= */}
        {tab === "notification" && (
          <Card>
            <SectionTitle title="🔔 Notifications" />

            <Grid>
              <Input
                label="Reminder hour"
                value={settings.reminderHour}
                onChange={(v) => update("reminderHour", Number(v))}
              />
            </Grid>
          </Card>
        )}
      </div>

      {/* SAVE BUTTON (sticky pro style feel) */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-2xl font-semibold transition"
        style={{
          background: "var(--primary)",
          color: "white",
          opacity: saving ? 0.6 : 1,
          boxShadow: "0 10px 30px rgba(99,102,241,0.25)",
        }}
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function SectionTitle({ title }) {
  return <h2 className="text-base font-semibold mb-4 opacity-90">{title}</h2>;
}

function Grid({ children }) {
  return <div className="space-y-4">{children}</div>;
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs opacity-60">{label}</label>

      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-xl outline-none transition"
        style={{
          background: "var(--card2)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>

      <button
        onClick={() => onChange(!value)}
        className="w-12 h-6 rounded-full p-1 transition flex items-center"
        style={{
          background: value ? "var(--primary)" : "var(--card2)",
        }}
      >
        <div
          className="w-4 h-4 bg-white rounded-full transition"
          style={{
            transform: value ? "translateX(24px)" : "translateX(0px)",
          }}
        />
      </button>
    </div>
  );
}
