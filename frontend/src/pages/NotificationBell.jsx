import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import api from "../utils/api";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  // ================= COUNT =================
  const loadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/count");
      setCount(Number(data?.count || 0));
    } catch (err) {
      console.error(err);
    }
  }, []);

  // ================= LIST =================
  const loadList = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/notifications/list");
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= INIT =================
  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [loadCount]);

  // ================= OPEN =================
  useEffect(() => {
    if (!open) return;

    loadList();
    loadCount(); // sync lại
  }, [open, loadList, loadCount]);

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BUTTON */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--card2)] border"
      >
        <Bell size={18} />

        {/* BADGE */}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
            {count}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-[var(--card)] border rounded-xl shadow-lg z-50">
          <div className="p-3 border-b font-semibold flex justify-between">
            <span>Từ cần ôn</span>
            <span className="text-xs opacity-60">{list.length} từ</span>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-[var(--card2)] animate-pulse rounded"
                  />
                ))}
              </div>
            ) : list.length === 0 ? (
              <p className="p-3 text-sm opacity-60">Không có từ cần ôn</p>
            ) : (
              list.map((w) => (
                <div
                  key={w.Id}
                  className="p-3 border-b hover:bg-[var(--card2)]"
                >
                  <div className="font-medium">{w.Word}</div>
                  <div className="text-xs opacity-60">{w.Meaning}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
