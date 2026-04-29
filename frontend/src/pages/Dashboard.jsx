import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/common/Card";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user] = useState("Danh");

  const [stats, setStats] = useState({
    weekNew: 0,
    weekReview: 0,
    goalNew: 60,
    goalReview: 50,
    streak: 0,
  });

  const [weeklyData, setWeeklyData] = useState([]);
  const [topik, setTopik] = useState({ level12: 0, level34: 0 });

  const [weekGoal, setWeekGoal] = useState({
    new: { current: 0, total: 60 },
    review: { current: 0, total: 50 },
    exercise: { current: 0, total: 20 },
  });

  // ================= FETCH =================
  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard/summary")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setStats({
          weekNew: data?.stats?.weekNew || 0,
          weekReview: data?.stats?.weekReview || 0,
          goalNew: data?.stats?.goalNew || 60,
          goalReview: data?.stats?.goalReview || 50,
          streak: data?.stats?.streak || 0,
        });

        setWeeklyData(data?.weeklyData || []);

        setTopik({
          level12: data?.topik?.level12 || 0,
          level34: data?.topik?.level34 || 0,
        });

        setWeekGoal(
          data?.weekGoal || {
            new: { current: 0, total: 60 },
            review: { current: 0, total: 50 },
            exercise: { current: 0, total: 20 },
          },
        );
      })
      .catch((err) => console.log(err));
  }, []);

  // ================= PROGRESS =================
  const progress = stats.goalNew
    ? Math.round((stats.weekNew / stats.goalNew) * 100)
    : 0;

  // ================= CHART DATA =================
  const chartData = (weeklyData || []).map((v, i) => ({
    day: `D${i + 1}`,
    words: Number(v || 0),
  }));

  // ================= PIE DATA =================
  const pieData = [
    { name: "TOPIK I", value: topik.level12 },
    { name: "TOPIK II", value: topik.level34 },
  ];

  const COLORS = ["#8b5cf6", "#ec4899"];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* ================= HERO ================= */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold">Xin chào {user} 👋</h1>
        <p className="text-white/80 text-sm mt-1">Tiếp tục giữ streak nhé 🔥</p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => navigate("/learn")}
            className="bg-white text-purple-600 px-4 py-2 rounded-xl font-semibold hover:scale-105 transition"
          >
            🚀 Học ngay
          </button>

          <button
            onClick={() => navigate("/review")}
            className="bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition"
          >
            🔁 Ôn tập
          </button>
        </div>
      </div>

      {/* ================= ROW 1 ================= */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Tiến độ tuần</p>
          <p className="text-2xl font-bold">{progress}%</p>

          <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
            <div
              className="h-2 bg-purple-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs mt-2 text-gray-500">
            {stats.weekNew}/{stats.goalNew}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Từ mới</p>
          <p className="text-3xl font-bold text-purple-600">{stats.weekNew}</p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Ôn tập</p>
          <p className="text-3xl font-bold text-pink-500">{stats.weekReview}</p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Chuỗi</p>
          <p className="text-3xl font-bold">🔥 {stats.streak}</p>
        </Card>
      </div>

      {/* ================= ROW 2 (FIXED LAYOUT) ================= */}
      <div className="grid grid-cols-4 gap-4">
        {/* LINE CHART - 2/4 */}
        <Card className="col-span-2">
          <h3 className="font-semibold mb-3">📈 7 ngày gần nhất</h3>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="words"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* PIE - 1/4 */}
        <Card>
          <h3 className="font-semibold mb-3">🎯 TOPIK</h3>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={70}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="text-sm mt-2 space-y-1">
            <div className="flex justify-between">
              <span>TOPIK I</span>
              <span>{topik.level12}%</span>
            </div>

            <div className="flex justify-between">
              <span>TOPIK II</span>
              <span>{topik.level34}%</span>
            </div>
          </div>
        </Card>

        {/* WEEK GOAL - 1/4 */}
        <Card>
          <h3 className="font-semibold mb-3">🎯 Mục tiêu tuần</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Từ mới</span>
              <span>
                {weekGoal.new.current}/{weekGoal.new.total}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Ôn tập</span>
              <span>
                {weekGoal.review.current}/{weekGoal.review.total}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Bài tập</span>
              <span>
                {weekGoal.exercise.current}/{weekGoal.exercise.total}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
