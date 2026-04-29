import { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.style.setProperty("--bg", "#0f172a");
      root.style.setProperty("--card", "#111c2e");
      root.style.setProperty("--card2", "#1a2740");
      root.style.setProperty("--text", "#e2e8f0");
      root.style.setProperty("--muted", "#94a3b8");
      root.style.setProperty("--primary", "#6366f1");
      root.style.setProperty("--border", "rgba(148,163,184,0.15)");
    } else {
      root.style.setProperty("--bg", "#f8fafc");
      root.style.setProperty("--card", "#ffffff");
      root.style.setProperty("--card2", "#f1f5f9");
      root.style.setProperty("--text", "#0f172a");
      root.style.setProperty("--muted", "#64748b");
      root.style.setProperty("--primary", "#6366f1");
      root.style.setProperty("--border", "rgba(15,23,42,0.08)");
    }

    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((v) => !v);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
