import {
  Home,
  Book,
  RefreshCcw,
  BarChart2,
  Brain,
  List,
  Settings,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const menu = [
  { icon: Home, label: "Trang chủ", path: "/" },
  { icon: Book, label: "Học từ vựng", path: "/learn" },
  { icon: RefreshCcw, label: "Ôn tập", path: "/review" },
  { icon: Brain, label: "Gợi ý ôn tập", path: "/suggest" },
  { icon: BarChart2, label: "Thống kê", path: "/stats" },
  { icon: List, label: "Danh sách từ", path: "/words" },
  { icon: Settings, label: "Cài đặt", path: "/settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="w-64 h-full p-4 flex flex-col"
      style={{
        background: "var(--card)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* LOGO */}
      <h2 className="text-xl font-bold mb-6 text-[var(--primary)]">TOPIK AI</h2>

      {/* MENU */}
      <div className="space-y-1 flex-1">
        {menu.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className={`
                flex items-center gap-3 px-3 py-2
                rounded-xl cursor-pointer
                transition-all duration-200
                relative overflow-hidden
                group
              `}
              style={{
                background: isActive ? "var(--card2)" : "transparent",
              }}
            >
              {/* hover glow layer */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                style={{
                  background: "var(--primary)",
                  opacity: 0.06,
                }}
              />

              <Icon
                size={18}
                style={{
                  color: isActive ? "var(--primary)" : "var(--muted)",
                }}
              />

              <span
                className="text-sm relative z-10"
                style={{
                  color: isActive ? "var(--text)" : "var(--muted)",
                }}
              >
                {item.label}
              </span>

              {/* ACTIVE INDICATOR (glow bar) */}
              {isActive && (
                <div
                  className="ml-auto w-1.5 h-6 rounded-full relative z-10"
                  style={{
                    background: "var(--primary)",
                    boxShadow: "0 0 15px var(--glow)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
