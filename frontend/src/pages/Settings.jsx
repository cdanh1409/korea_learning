import { useEffect, useMemo, useState, useCallback } from "react";

import Card from "../components/common/Card";
import useTheme from "../hooks/useTheme";
import api from "../utils/api";
import { Moon, Sun } from "lucide-react";

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
};

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

export default function Settings() {
  const { darkMode, toggleTheme } = useTheme();

  const [tab, setTab] = useState("profile");
  const [settings, setSettings] = useState(defaultSettings);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("/default-avatar.png");

  const tabs = useMemo(
    () => [
      { key: "profile", label: "Hồ sơ" },
      { key: "security", label: "Bảo mật" },
      { key: "appearance", label: "Giao diện" },
    ],
    [],
  );

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      try {
        const res = await api.get("/user/profile");

        if (ignore) return;

        const profile = res.data || {};

        setSettings((prev) => ({
          ...prev,
          profile,
        }));

        setAvatarPreview(profile.avatarUrl || "/default-avatar.png");
      } catch {
        setMsg("❌ Không tải được hồ sơ");
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  /* ================= AUTO HIDE MESSAGE ================= */
  useEffect(() => {
    if (!msg.startsWith("✅")) return;

    const timer = setTimeout(() => {
      setMsg("");
    }, 2000);

    return () => clearTimeout(timer);
  }, [msg]);
  const update = useCallback((group, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }));
  }, []);

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMsg("❌ File không hợp lệ");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMsg("❌ Ảnh vượt quá 5MB");
      return;
    }

    setAvatarFile(file);

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
  };

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

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await api.put("/user/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (settings.security.newPassword) {
        await api.post("/user/change-password", {
          oldPassword: settings.security.oldPassword,
          newPassword: settings.security.newPassword,
        });
      }

      setSettings((prev) => ({
        ...prev,
        security: {
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        },
      }));

      setAvatarFile(null);

      setMsg("✅ Lưu thành công");
    } catch (err) {
      console.error(err);

      setMsg(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "❌ Lỗi khi lưu",
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordError =
    settings.security.newPassword &&
    settings.security.newPassword !== settings.security.confirmPassword;

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)]">
      <aside className="w-64 hidden md:flex flex-col border-r p-4 gap-2">
        <h1 className="text-2xl font-bold mb-4">Cài đặt</h1>

        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-3 rounded-xl text-left transition-all"
            style={{
              background: tab === t.key ? "var(--card2)" : "transparent",
              color: tab === t.key ? "var(--primary)" : "var(--text)",
              fontWeight: tab === t.key ? 700 : 500,
            }}
          >
            {t.label}
          </button>
        ))}
      </aside>

      <main className="flex-1 p-6 space-y-6">
        {msg && <div className="p-3 rounded-xl">{msg}</div>}

        {tab === "profile" && (
          <Card className="p-5 space-y-4">
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-28 h-28 rounded-full object-cover"
            />

            <input type="file" accept="image/*" onChange={onAvatarChange} />

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
              label="Xác nhận mật khẩu"
              type="password"
              value={settings.security.confirmPassword}
              onChange={(v) => update("security", "confirmPassword", v)}
            />

            {passwordError && (
              <p className="text-red-500">❌ Mật khẩu không khớp</p>
            )}
          </Card>
        )}
        {tab === "appearance" && (
          <Card className="p-5 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Giao diện ứng dụng</h2>

              <p className="opacity-70 text-sm mt-1">
                Tùy chỉnh chế độ hiển thị của hệ thống.
              </p>
            </div>

            <div
              className="
        flex items-center justify-between
        p-5 rounded-2xl border
      "
              style={{
                background: "var(--card2)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="
            w-12 h-12 rounded-xl
            flex items-center justify-center
          "
                  style={{
                    background: "var(--card)",
                  }}
                >
                  {darkMode ? <Moon size={22} /> : <Sun size={22} />}
                </div>

                <div>
                  <p className="font-semibold">
                    {darkMode ? "Dark Mode" : "Light Mode"}
                  </p>

                  <p className="text-sm opacity-70">
                    {darkMode
                      ? "Đang sử dụng giao diện tối"
                      : "Đang sử dụng giao diện sáng"}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className={`
          relative w-16 h-9 rounded-full transition-all
          ${darkMode ? "bg-indigo-600" : "bg-slate-300"}
        `}
              >
                <span
                  className={`
            absolute top-1 left-1
            w-7 h-7 rounded-full bg-white
            transition-transform
            ${darkMode ? "translate-x-7" : ""}
          `}
                />
              </button>
            </div>

            <div
              className="p-5 rounded-2xl border"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <p className="font-semibold mb-3">Xem trước giao diện</p>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-xl border"
                  style={{
                    background: "var(--card2)",
                    borderColor: "var(--border)",
                  }}
                >
                  Card mẫu
                </div>

                <div
                  className="p-4 rounded-xl border"
                  style={{
                    background: "var(--card2)",
                    borderColor: "var(--border)",
                  }}
                >
                  Nội dung mẫu
                </div>
              </div>
            </div>
          </Card>
        )}
        <div className="sticky bottom-0 pt-4 bg-[var(--bg)]/80 backdrop-blur-md">
          <button
            onClick={save}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-indigo-500 to-purple-600
              shadow-lg shadow-indigo-500/30
              hover:scale-[1.02]
              active:scale-[0.98]
              transition
              disabled:opacity-60"
          >
            {loading ? "⏳ Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </main>
    </div>
  );
}
