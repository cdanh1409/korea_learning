import { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";

const darkTheme = {
  "--bg": "#0f172a",
  "--card": "#111c2e",
  "--card2": "#1a2740",
  "--text": "#e2e8f0",
  "--muted": "#94a3b8",
  "--primary": "#6366f1",
  "--border": "rgba(148,163,184,0.15)",
  "--success": "#22c55e",
  "--warning": "#f59e0b",
  "--danger": "#ef4444",
  "--info": "#38bdf8",
};

const lightTheme = {
  "--bg": "#f8fafc",
  "--card": "#ffffff",
  "--card2": "#f1f5f9",
  "--text": "#0f172a",
  "--muted": "#64748b",
  "--primary": "#6366f1",
  "--border": "rgba(15,23,42,0.08)",
  "--success": "#16a34a",
  "--warning": "#d97706",
  "--danger": "#dc2626",
  "--info": "#0284c7",
};

const getInitialTheme = () => {
  if (typeof window === "undefined") return false;

  const saved = localStorage.getItem("darkMode");
  if (saved !== null) return JSON.parse(saved);

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(darkMode ? darkTheme : lightTheme);
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((v) => !v);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
