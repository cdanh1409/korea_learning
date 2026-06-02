import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import api from "../utils/api";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  /* ================= API ================= */
  const loadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/count");
      setCount(data?.count || 0);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/notifications/list");
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= INIT COUNT ================= */
  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, [loadCount]);

  /* ================= OPEN DROPDOWN ================= */
  useEffect(() => {
    if (open) {
      loadList();

      // UX: mở ra coi như đã đọc
      setCount(0);
    }
  }, [open, loadList]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BUTTON */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--card2)] border transition hover:scale-105 active:scale-95"
      >
        <Bell size={18} />

        {/* BADGE */}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 rounded-full animate-pulse">
            {count}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-72 bg-[var(--card)] border rounded-xl shadow-lg z-50
                     animate-[fadeIn_0.15s_ease-out]"
        >
          {/* HEADER */}
          <div className="p-3 border-b font-semibold flex justify-between items-center">
            <span>Từ cần ôn</span>
            <span className="text-xs opacity-60">{list.length} từ</span>
          </div>

          {/* LIST */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              // skeleton
              <div className="p-3 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-[var(--card2)] rounded animate-pulse"
                  />
                ))}
              </div>
            ) : list.length === 0 ? (
              <p className="p-3 text-sm opacity-60">Không có từ cần ôn</p>
            ) : (
              list.map((w) => (
                <div
                  key={w.Id}
                  className="p-3 hover:bg-[var(--card2)] border-b cursor-pointer transition"
                  onClick={() => setOpen(false)}
                >
                  <div className="font-medium">{w.Word}</div>
                  <div className="text-xs opacity-60">{w.Meaning}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ANIMATION CSS (global hoặc tailwind config) */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-6px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}
