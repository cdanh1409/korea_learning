import { useEffect, useState } from "react";
import api from "../utils/api";

export default function useSettings() {
  const [settings, setSettings] = useState({
    darkMode: false,
    autoPlayAudio: true,
    showImageFirst: true,
  });

  const [loading, setLoading] = useState(true);

  // load từ API
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const res = await api.get("/settings");

        if (ignore) return;

        setSettings((prev) => ({
          ...prev,
          ...res.data,
        }));
      } catch (err) {
        console.error("load settings error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, []);

  // apply dark mode global
  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);

  return { settings, setSettings, loading };
}
