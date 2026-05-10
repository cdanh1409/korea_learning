import { Moon, Sun } from "lucide-react";
import { useContext } from "react";
import { ThemeContext } from "../context/theme/ThemeContext";

export default function Header() {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <div
      className="flex items-center px-6 py-4"
      style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* LEFT BUTTON */}
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

      {/* RIGHT SIDE */}
      <div className="ml-auto flex items-center gap-3">
        {/* THEME TOGGLE */}
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

        {/* AVATAR */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div
            className="w-9 h-9 rounded-full"
            style={{
              background: "linear-gradient(135deg, #a78bfa, #f472b6)",
            }}
          />

          <span style={{ color: "var(--text)" }}>Anh</span>
        </div>
      </div>
    </div>
  );
}
