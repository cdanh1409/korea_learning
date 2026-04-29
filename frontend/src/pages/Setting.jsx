import { useEffect, useState } from "react";
import Card from "../components/common/Card";

export default function Settings() {
  const [tab, setTab] = useState("learning");

  const [settings, setSettings] = useState({
    // ===== Learning =====
    dailyNew: 20,
    showImageFirst: true,
    autoPlayAudio: true,

    // ===== Review =====
    dailyReview: 50,
    easyInterval: 3,
    mediumInterval: 1,

    // ===== UI =====
    darkMode: false,
    fontSize: 16,

    // ===== Notification =====
    reminderHour: 20,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // ===== LOAD =====
  useEffect(() => {
    fetch("http://localhost:5000/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings((prev) => ({
          ...prev,
          ...data,
        }));
      })
      .catch(() => setMsg("❌ Không tải được settings"))
      .finally(() => setLoading(false));
  }, []);

  // ===== CHANGE =====
  const update = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ===== SAVE =====
  const handleSave = async () => {
    setSaving(true);
    setMsg("");

    try {
      const res = await fetch("http://localhost:5000/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error();

      setMsg("✅ Đã lưu");
    } catch {
      setMsg("❌ Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 animate-pulse">Loading...</div>;

  return (
    <div className="p-6 min-h-screen bg-gray-100 space-y-6">
      <h1 className="text-2xl font-bold">⚙️ Settings</h1>

      {/* ===== Tabs ===== */}
      <div className="flex gap-2">
        {["learning", "review", "ui", "notification"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl ${
              tab === t ? "bg-purple-600 text-white" : "bg-white shadow"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ===== MESSAGE ===== */}
      {msg && <div className="bg-white p-3 rounded shadow">{msg}</div>}

      {/* ===== CONTENT ===== */}
      {tab === "learning" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">🧠 Learning</h2>

          <Input
            label="Từ mới mỗi ngày"
            value={settings.dailyNew}
            onChange={(v) => update("dailyNew", Number(v))}
          />

          <Toggle
            label="Ưu tiên hiện hình ảnh"
            value={settings.showImageFirst}
            onChange={(v) => update("showImageFirst", v)}
          />

          <Toggle
            label="Tự động phát âm"
            value={settings.autoPlayAudio}
            onChange={(v) => update("autoPlayAudio", v)}
          />
        </Card>
      )}

      {tab === "review" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">🔁 Review (SRS)</h2>

          <Input
            label="Ôn mỗi ngày"
            value={settings.dailyReview}
            onChange={(v) => update("dailyReview", Number(v))}
          />

          <Input
            label="Easy (+ ngày)"
            value={settings.easyInterval}
            onChange={(v) => update("easyInterval", Number(v))}
          />

          <Input
            label="Medium (+ ngày)"
            value={settings.mediumInterval}
            onChange={(v) => update("mediumInterval", Number(v))}
          />
        </Card>
      )}

      {tab === "ui" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">🎨 UI</h2>

          <Toggle
            label="Dark mode"
            value={settings.darkMode}
            onChange={(v) => update("darkMode", v)}
          />

          <Input
            label="Font size"
            value={settings.fontSize}
            onChange={(v) => update("fontSize", Number(v))}
          />
        </Card>
      )}

      {tab === "notification" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">🔔 Notification</h2>

          <Input
            label="Giờ nhắc học (0-23)"
            value={settings.reminderHour}
            onChange={(v) => update("reminderHour", Number(v))}
          />
        </Card>
      )}

      {/* ===== SAVE ===== */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-semibold transition ${
          saving ? "bg-gray-400" : "bg-purple-600 text-white hover:scale-105"
        }`}
      >
        {saving ? "Đang lưu..." : "💾 Lưu"}
      </button>
    </div>
  );
}

////////////////////////////////////////////////////
// COMPONENTS
////////////////////////////////////////////////////

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-500">{label}</label>
      <input
        type="number"
        value={value}
        min="0"
        onChange={(e) => onChange(e.target.value)}
        className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-purple-400 outline-none"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
          value ? "bg-purple-600" : "bg-gray-300"
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
            value ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}
    