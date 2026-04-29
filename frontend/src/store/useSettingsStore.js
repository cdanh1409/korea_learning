import { create } from "zustand";

const defaultSettings = {
  dailyNew: 20,
  showImageFirst: true,
  autoPlayAudio: true,

  dailyReview: 50,
  easyInterval: 3,
  mediumInterval: 1,

  darkMode: false,
  fontSize: 16,
  reminderHour: 20,
};

export const useSettingsStore = create((set, get) => ({
  settings: loadInitial(),

  // ===== UPDATE 1 FIELD =====
  updateSetting: (key, value) => {
    const newSettings = {
      ...get().settings,
      [key]: value,
    };

    localStorage.setItem("settings", JSON.stringify(newSettings));

    set({ settings: newSettings });
  },

  // ===== SET FULL =====
  setSettings: (data) => {
    const merged = {
      ...get().settings,
      ...data,
    };

    localStorage.setItem("settings", JSON.stringify(merged));

    set({ settings: merged });
  },

  // ===== LOAD FROM API =====
  fetchSettings: async () => {
    try {
      const res = await fetch("http://localhost:5000/api/settings");
      const data = await res.json();

      get().setSettings(data);
    } catch (e) {
      console.log("fetch settings error", e);
    }
  },
}));

function loadInitial() {
  const cached = localStorage.getItem("settings");
  return cached ? JSON.parse(cached) : defaultSettings;
}
