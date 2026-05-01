import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import useTheme from "../hooks/useTheme";
import api from "../utils/api";

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

  // ================= LOAD SETTINGS =================
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const res = await api.get("/settings");

        if (ignore) return;

        const merged = { ...settings, ...res.data };
        setSettings(merged);
        localStorage.setItem("settings", JSON.stringify(merged));
      } catch (err) {
        console.error(err);
        setMsg("❌ Không tải được settings");
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, []);

  // ================= UPDATE LOCAL =================
  const update = (key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("settings", JSON.stringify(updated));
      return updated;
    });
  };

  // ================= SAVE =================
  const handleSave = async () => {
    setSaving(true);
    setMsg("");

    try {
      await api.post("/settings", settings);
      setMsg("✅ Saved successfully");
    } catch (err) {
      console.error(err);
      setMsg("❌ Save failed");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "learning", label: "🧠 Learning" },
    { key: "review", label: "🔁 Review" },
    { key: "ui", label: "🎨 UI" },
    { key: "notification", label: "🔔 Notify" },
  ];

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm">
            Tùy chỉnh trải nghiệm học của bạn
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-xl text-sm font-medium transition hover:scale-105"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {darkMode ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      {/* TAB */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: tab === t.key ? "var(--primary)" : "var(--card)",
              color: tab === t.key ? "white" : "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MESSAGE */}
      {msg && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        >
          {msg}
        </div>
      )}

      {/* ================= CONTENT ================= */}
      <div className="grid gap-6">
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

      {/* SAVE */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-2xl font-semibold transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: "var(--primary)",
          color: "white",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function SectionTitle({ title }) {
  return <h2 className="text-lg font-semibold mb-4 tracking-tight">{title}</h2>;
}

function Grid({ children }) {
  return <div className="space-y-5">{children}</div>;
}

function Input({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </label>

      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl outline-none transition"
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
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>

      <button
        onClick={() => onChange(!value)}
        className="w-12 h-6 rounded-full p-1 flex items-center transition"
        style={{
          background: value ? "var(--primary)" : "var(--card2)",
        }}
      >
        <div
          className="w-4 h-4 bg-white rounded-full transition-all duration-200"
          style={{
            transform: value ? "translateX(24px)" : "translateX(0px)",
          }}
        />
      </button>
    </div>
  );
}
