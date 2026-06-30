import {
  Home,
  Book,
  RefreshCcw,
  BarChart2,
  Brain,
  List,
  Settings,
  LogOut,
  //FileText,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";

import { ThemeContext } from "../context/theme/ThemeContext";

const menu = [
  { icon: Home, label: "Trang chủ", path: "/" },

  // HỌC
  { icon: Book, label: "Học từ vựng", path: "/learn" },

  // TEST TRÌNH ĐỘ
  {
    icon: Brain,
    label: "Kiểm tra trình độ",
    path: "/placement-test",
  },

  // ÔN TẬP
  { icon: RefreshCcw, label: "Ôn tập", path: "/review" },

  // {
  //   icon: FileText,
  //   label: "Ôn TOPIK",
  //   path: "/topik",
  // },

  // QUẢN LÝ
  {
    icon: BarChart2,
    label: "Thống kê",
    path: "/stats",
  },

  {
    icon: List,
    label: "Danh sách từ",
    path: "/words",
  },

  {
    icon: Settings,
    label: "Cài đặt",
    path: "/settings",
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { darkMode } = useContext(ThemeContext);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất không?")) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  return (
    <div
      className="w-64 h-full p-4 flex flex-col"
      style={{
        background: "var(--card)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* ================= LOGO ================= */}
      <div className="mb-6 flex items-center justify-center">
        <img
          src="http://localhost:5000/images/logo.png"
          alt="TOPIK AI"
          className="
            w-40 object-contain
            transition-all duration-300
            hover:scale-105 hover:-translate-y-0.5
            select-none pointer-events-none
          "
          style={{
            filter: darkMode
              ? "drop-shadow(0 0 14px rgba(99,102,241,0.35)) brightness(1.08)"
              : "drop-shadow(0 0 10px rgba(99,102,241,0.18))",
          }}
        />
      </div>

      {/* ================= MENU ================= */}
      <div className="space-y-1 flex-1">
        {menu.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className="
                flex items-center gap-3 px-3 py-2
                rounded-xl cursor-pointer
                transition-all duration-200
                relative overflow-hidden
                group
              "
              style={{
                background: isActive ? "var(--card2)" : "transparent",
              }}
            >
              {/* Hover Glow */}
              <div
                className="
                  absolute inset-0
                  opacity-0 group-hover:opacity-100
                  transition-all duration-300
                "
                style={{
                  background: "var(--primary)",
                  opacity: 0.06,
                }}
              />

              {/* Icon */}
              <Icon
                size={18}
                className="relative z-10"
                style={{
                  color: isActive ? "var(--primary)" : "var(--muted)",
                }}
              />

              {/* Label */}
              <span
                className="text-sm relative z-10"
                style={{
                  color: isActive ? "var(--text)" : "var(--muted)",
                }}
              >
                {item.label}
              </span>

              {/* Active Indicator */}
              {isActive && (
                <div
                  className="ml-auto w-1.5 h-6 rounded-full relative z-10"
                  style={{
                    background: "var(--primary)",
                    boxShadow: "0 0 15px rgba(99,102,241,0.5)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ================= LOGOUT ================= */}
      <div className="mt-3">
        <div
          onClick={handleLogout}
          className="
            flex items-center gap-3 px-3 py-2
            rounded-xl cursor-pointer
            transition-all duration-200
            relative overflow-hidden
            group
            hover:bg-red-500/10
          "
        >
          {/* Hover Red Glow */}
          <div
            className="
              absolute inset-0
              opacity-0 group-hover:opacity-100
              transition-all duration-300
            "
            style={{
              background: "#ef4444",
              opacity: 0.08,
            }}
          />

          <LogOut
            size={18}
            className="relative z-10"
            style={{ color: "#ef4444" }}
          />

          <span className="text-sm relative z-10" style={{ color: "#ef4444" }}>
            Đăng xuất
          </span>
        </div>
      </div>
    </div>
  );
}
