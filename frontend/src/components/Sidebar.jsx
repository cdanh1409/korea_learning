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
  const location = useLocation(); // 👈 để biết đang ở trang nào

  return (
    <div className="w-64 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold mb-6 text-purple-600">TOPIK AI</h2>

      <div className="space-y-2">
        {menu.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <div
              key={index}
              onClick={() => navigate(item.path)} // 👈 click là chuyển trang
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition
              ${
                isActive ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
