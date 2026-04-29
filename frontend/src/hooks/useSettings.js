import { useEffect, useState } from "react";

export default function useSettings() {
  const [settings, setSettings] = useState({
    darkMode: false,
    autoPlayAudio: true,
    showImageFirst: true,
  });

  const [loading, setLoading] = useState(true);

  // load từ API
  useEffect(() => {
    fetch("http://localhost:5000/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings((prev) => ({
          ...prev,
          ...data,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // apply dark mode global
  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);

  return { settings, setSettings, loading };
}
