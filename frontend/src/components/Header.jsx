import { Moon, Sun } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../context/theme/ThemeContext";
import api from "../utils/api";
import NotificationBell from "../pages/NotificationBell";

export default function Header() {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  const [user, setUser] = useState({
    fullName: "",
    avatarUrl: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/user/profile");

        setUser({
          fullName: data?.fullName || "",
          avatarUrl: data?.avatarUrl || "",
        });
      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <header
      className="flex items-center px-6 py-4"
      style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <button
        className="px-5 py-2 rounded-xl font-medium"
        style={{
          background: "var(--primary)",
          color: "#fff",
          boxShadow: "0 10px 30px var(--glow)",
        }}
      >
        TOPIK AI
      </button>

      {/* Right */}
      <div className="ml-auto flex items-center gap-3">
        {/* 🔔 NOTIFICATION */}
        <NotificationBell />

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition hover:scale-105"
          style={{
            background: "var(--card2)",
            border: "1px solid var(--border)",
          }}
        >
          {darkMode ? (
            <Sun size={18} color="var(--text)" />
          ) : (
            <Moon size={18} color="var(--text)" />
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-9 h-9 rounded-full object-cover border"
              style={{
                borderColor: "var(--border)",
              }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold"
              style={{
                background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
              }}
            >
              {user.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}

          <span
            className="font-medium"
            style={{
              color: "var(--text)",
            }}
          >
            {loading ? "Loading..." : user.fullName || "User"}
          </span>
        </div>
      </div>
    </header>
  );
}
