import { useEffect, useMemo, useState, useCallback } from "react";

import Card from "../components/common/Card";
import useTheme from "../hooks/useTheme";
import api from "../utils/api";

/* ================= DEFAULT ================= */
const defaultSettings = {
  profile: {
    fullName: "",
    email: "",
    avatarUrl: "",
  },

  security: {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  },

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
  },

  notify: {
    enableReminder: true,
    reminderHour: 20,
  },
};

/* ================= UTIL ================= */
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

function deepMerge(target, source) {
  const output = Array.isArray(target) ? [...target] : { ...target };
  if (!source) return output;

  for (const key in source) {
    const sv = source[key];
    const tv = output[key];

    if (
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      typeof tv === "object" &&
      tv !== null
    ) {
      output[key] = deepMerge(tv, sv);
    } else {
      output[key] = sv;
    }
  }

  return output;
}

function getInitialSettings() {
  try {
    const cached = localStorage.getItem("settings");
    if (!cached) return deepClone(defaultSettings);

    return deepMerge(deepClone(defaultSettings), JSON.parse(cached));
  } catch {
    return deepClone(defaultSettings);
  }
}

/* ================= UI ================= */
function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>

      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
          value ? "bg-green-500" : "bg-gray-400"
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full transition ${
            value ? "ml-auto" : ""
          }`}
        />
      </button>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", disabled }) {
  return (
    <div className="space-y-1">
      <p className="text-xs opacity-70">{label}</p>
      <input
        type={type}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full p-2 rounded-xl border bg-transparent"
      />
    </div>
  );
}

/* ================= MAIN ================= */
export default function Settings() {
  const { darkMode, toggleTheme } = useTheme();

  const [tab, setTab] = useState("profile");
  const [settings, setSettings] = useState(() => getInitialSettings());
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const tabs = useMemo(
    () => [
      { key: "profile", label: "Hồ sơ" },
      { key: "security", label: "Bảo mật" },
      { key: "learning", label: "Học tập" },
      { key: "review", label: "Ôn tập" },
      { key: "lapse", label: "Quên bài" },
      { key: "behavior", label: "Hành vi" },
      { key: "ui", label: "Giao diện" },
      { key: "notify", label: "Thông báo" },
    ],
    [],
  );

  /* ================= LOAD ================= */
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const [settingsRes, profileRes] = await Promise.all([
          api.get("/settings"),
          api.get("/user/profile"),
        ]);

        if (ignore) return;

        const merged = deepMerge(deepClone(defaultSettings), {
          ...settingsRes.data,
          profile: profileRes.data || {},
        });

        setSettings(merged);
        localStorage.setItem("settings", JSON.stringify(merged));

        const avatar = merged.profile?.avatarUrl;
        setAvatarPreview(avatar || "/default-avatar.png");
      } catch {
        setMsg("❌ Không tải được dữ liệu");
      }
    };

    load();

    return () => {
      ignore = true;
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, []);

  /* ================= UPDATE ================= */
  const update = useCallback((group, key, value) => {
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
  }, []);

  /* ================= AVATAR ================= */
  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMsg("❌ File không hợp lệ");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMsg("❌ Ảnh quá lớn (max 5MB)");
      return;
    }

    setAvatarFile(file);

    const url = URL.createObjectURL(file);

    setAvatarPreview((old) => {
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      return url;
    });
  };

  /* ================= SAVE ================= */
  const save = async () => {
    if (loading) return;

    if (
      settings.security.newPassword &&
      settings.security.newPassword !== settings.security.confirmPassword
    ) {
      setMsg("❌ Mật khẩu không khớp");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const formData = new FormData();
      formData.append("fullName", settings.profile.fullName || "");

      if (avatarFile) formData.append("avatar", avatarFile);

      await api.put("/user/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (settings.security.newPassword) {
        await api.post("/user/change-password", {
          oldPassword: settings.security.oldPassword,
          newPassword: settings.security.newPassword,
        });
      }

      const clean = deepClone(settings);
      clean.security = {
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      };

      setSettings(clean);
      localStorage.setItem("settings", JSON.stringify(clean));

      setMsg("✅ Lưu thành công");
    } catch (err) {
      setMsg(err.response?.data?.message || "❌ Lỗi khi lưu");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET ================= */
  const reset = () => {
    const fresh = deepClone(defaultSettings);

    setSettings(fresh);
    localStorage.setItem("settings", JSON.stringify(fresh));

    setAvatarFile(null);
    setAvatarPreview("/default-avatar.png");
    setMsg("♻ Đã reset");
  };

  const renderField = (group, key, value) => {
    if (typeof value === "boolean") {
      return (
        <Toggle
          key={key}
          label={key}
          value={value}
          onChange={(v) => update(group, key, v)}
        />
      );
    }

    if (typeof value === "number") {
      return (
        <Input
          key={key}
          label={key}
          type="number"
          value={value}
          onChange={(v) => update(group, key, Number(v))}
        />
      );
    }

    return (
      <Input
        key={key}
        label={key}
        value={value}
        onChange={(v) => update(group, key, v)}
      />
    );
  };

  const passwordError =
    settings.security.newPassword &&
    settings.security.newPassword !== settings.security.confirmPassword;

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)]">
      {/* SIDEBAR */}
      <aside className="w-64 hidden md:flex flex-col border-r p-4 gap-2">
        <h1 className="text-2xl font-bold mb-4">Cài đặt</h1>

        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-left ${
              tab === t.key ? "bg-gray-200 dark:bg-gray-700" : ""
            }`}
          >
            {t.label}
          </button>
        ))}

        <button className="mt-auto py-2 rounded-xl" onClick={toggleTheme}>
          {darkMode ? "🌙 Dark" : "☀️ Light"}
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 space-y-6">
        {msg && <div className="p-3 rounded-xl">{msg}</div>}

        {tab === "profile" && (
          <Card className="p-5 space-y-4">
            <img
              src={avatarPreview || "/default-avatar.png"}
              className="w-28 h-28 rounded-full object-cover"
            />

            <input type="file" onChange={onAvatarChange} />

            <Input
              label="Họ tên"
              value={settings.profile.fullName}
              onChange={(v) => update("profile", "fullName", v)}
            />

            <Input label="Email" value={settings.profile.email} disabled />
          </Card>
        )}

        {tab === "security" && (
          <Card className="p-5 space-y-4">
            <Input
              label="Mật khẩu cũ"
              type="password"
              value={settings.security.oldPassword}
              onChange={(v) => update("security", "oldPassword", v)}
            />

            <Input
              label="Mật khẩu mới"
              type="password"
              value={settings.security.newPassword}
              onChange={(v) => update("security", "newPassword", v)}
            />

            <Input
              label="Xác nhận"
              type="password"
              value={settings.security.confirmPassword}
              onChange={(v) => update("security", "confirmPassword", v)}
            />

            {passwordError && (
              <p className="text-red-500">❌ Mật khẩu không khớp</p>
            )}
          </Card>
        )}

        {["learning", "review", "lapse", "behavior", "ui", "notify"].includes(
          tab,
        ) && (
          <Card className="p-5 space-y-3">
            {Object.entries(settings[tab]).map(([k, v]) =>
              renderField(tab, k, v),
            )}
          </Card>
        )}

        {/* ACTION */}
        <div className="sticky bottom-0 flex gap-3 pt-4 bg-[var(--bg)]/80 backdrop-blur-md">
          {/* SAVE */}
          <button
            onClick={save}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white
               bg-gradient-to-r from-indigo-500 to-purple-600
               shadow-lg shadow-indigo-500/30
               hover:scale-[1.02] active:scale-[0.98]
               transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "⏳ Đang lưu..." : "Lưu thay đổi"}
          </button>

          {/* RESET */}
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl font-semibold
               bg-red-500 text-white
               shadow-lg shadow-red-500/20
               hover:bg-red-600 hover:scale-[1.02]
               active:scale-[0.98]
               transition"
          >
            Reset
          </button>
        </div>
      </main>
    </div>
  );
}
