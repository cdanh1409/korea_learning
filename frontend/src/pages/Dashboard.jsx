import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import api from "../utils/api";

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

// ================= SAFE =================
const safeNumber = (v) => (isNaN(Number(v)) ? 0 : Number(v));

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState("Danh");

  const [stats, setStats] = useState({
    newWords: 0,
    reviewedWords: 0,
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
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.get("/dashboard/summary");
        const data = res.data;

        console.log("📊 DASHBOARD RAW:", data);

        setStats({
          newWords: safeNumber(data?.stats?.newWords),
          reviewedWords: safeNumber(data?.stats?.reviewedWords),
          streak: safeNumber(data?.stats?.streak),
        });

        setWeeklyData(Array.isArray(data?.weeklyData) ? data.weeklyData : []);

        setTopik({
          level12: safeNumber(data?.topik?.level12),
          level34: safeNumber(data?.topik?.level34),
        });

        setWeekGoal({
          new: {
            current: safeNumber(data?.weekGoal?.new?.current),
            total: 60,
          },
          review: {
            current: safeNumber(data?.weekGoal?.review?.current),
            total: 50,
          },
          exercise: {
            current: safeNumber(data?.weekGoal?.exercise?.current),
            total: 20,
          },
        });
      } catch (err) {
        console.log("❌ FETCH ERROR:", err);

        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        }
      }
    };

    fetchData();
  }, [navigate]);

  // ================= PROGRESS =================
  const progress =
    stats.reviewedWords > 0 ? Math.round((stats.reviewedWords / 50) * 100) : 0;

  // ================= CHART DATA =================
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));

    const value = safeNumber(weeklyData?.[i]);

    return {
      day: d.toLocaleDateString("vi-VN", { weekday: "short" }),
      reviews: value,
    };
  });

  // ================= TOPIK =================
  const level12 = safeNumber(topik?.level12);
  const level34 = safeNumber(topik?.level34);
  const totalTopik = level12 + level34;

  const pieData =
    totalTopik > 0
      ? [
          { name: "TOPIK I", value: level12 },
          { name: "TOPIK II", value: level34 },
        ]
      : [{ name: "EMPTY", value: 1 }];

  const COLORS = ["#6366f1", "#94a3b8"];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* HERO */}
      <div className="rounded-2xl p-6 border bg-[var(--card)]">
        <h1 className="text-2xl font-bold">Xin chào {user} 👋</h1>
        <p className="text-sm opacity-70">Tiếp tục giữ streak 🔥</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p>Tiến độ tuần</p>
          <p className="text-2xl font-bold">{progress}%</p>

          <div className="h-2 bg-[var(--card2)] rounded mt-2">
            <div
              className="h-2 bg-[var(--primary)] rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>

        <Card>
          <p>Từ chưa học</p>
          <p className="text-2xl font-bold">{stats.newWords}</p>
        </Card>

        <Card>
          <p>Đã học (7 ngày)</p>
          <p className="text-2xl font-bold">{stats.reviewedWords}</p>
        </Card>

        <Card>
          <p>Chuỗi</p>
          <p className="text-2xl font-bold">🔥 {stats.streak}</p>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* LINE CHART */}
        <Card className="col-span-1 lg:col-span-2">
          <h3>7 ngày</h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid opacity={0.2} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="reviews"
                stroke="#6366f1"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* PIE CHART */}
        <Card>
          <h3>TOPIK</h3>

          {totalTopik === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm opacity-60">
              Chưa có dữ liệu TOPIK
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>

                <text
                  x="50%"
                  y="45%"
                  textAnchor="middle"
                  fontSize={22}
                  fontWeight="bold"
                  fill="var(--text)"
                >
                  {totalTopik}
                </text>

                <text
                  x="50%"
                  y="60%"
                  textAnchor="middle"
                  fontSize={12}
                  fill="var(--muted)"
                >
                  từ đã học
                </text>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}

          <div className="flex justify-center gap-4 text-sm mt-2">
            <span style={{ color: COLORS[0] }}>■ TOPIK I</span>
            <span style={{ color: COLORS[1] }}>■ TOPIK II</span>
          </div>
        </Card>

        {/* GOALS */}
        <Card>
          <h3>Mục tiêu</h3>

          <Row label="Đã học" value={weekGoal.review} />
          <Row label="Chưa học" value={weekGoal.new} />
          <Row label="Bài tập" value={weekGoal.exercise} />
        </Card>
      </div>
    </div>
  );
}

// ================= ROW =================
function Row({ label, value }) {
  const safe = (v) => (isNaN(Number(v)) ? 0 : Number(v));

  return (
    <div className="flex justify-between text-sm py-1">
      <span>{label}</span>
      <span>
        {safe(value?.current)}/{safe(value?.total)}
      </span>
    </div>
  );
}
