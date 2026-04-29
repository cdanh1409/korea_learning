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

  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard/summary")
      .then((res) => res.json())
      .then((data) => {
        setStats(data?.stats || stats);
        setWeeklyData(data?.weeklyData || []);
        setTopik(data?.topik || topik);
        setWeekGoal(data?.weekGoal || weekGoal);
      })
      .catch(() => {});
  }, []);

  const progress = stats.goalNew
    ? Math.round((stats.weekNew / stats.goalNew) * 100)
    : 0;

  const chartData = weeklyData.map((v, i) => ({
    day: `D${i + 1}`,
    words: Number(v || 0),
  }));

  const pieData = [
    { name: "TOPIK I", value: topik.level12 },
    { name: "TOPIK II", value: topik.level34 },
  ];

  const COLORS = ["var(--primary)", "var(--muted)"];

  return (
    <div
      className="p-6 space-y-6 min-h-screen"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {/* ================= HERO ================= */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden border"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        {/* glow */}
        <div
          className="absolute -top-20 -right-20 w-[300px] h-[300px] blur-3xl opacity-20"
          style={{ background: "var(--primary)" }}
        />

        <h1 className="text-2xl font-bold">Xin chào {user} 👋</h1>

        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Tiếp tục giữ streak nhé 🔥
        </p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => navigate("/learn")}
            className="px-4 py-2 rounded-xl font-semibold text-white transition hover:scale-[1.03]"
            style={{
              background: "var(--primary)",
              boxShadow: "0 10px 30px var(--glow)",
            }}
          >
            🚀 Học ngay
          </button>

          <button
            onClick={() => navigate("/review")}
            className="px-4 py-2 rounded-xl transition hover:scale-[1.03]"
            style={{
              background: "var(--card2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            🔁 Ôn tập
          </button>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Tiến độ tuần
          </p>

          <p className="text-2xl font-bold">{progress}%</p>

          <div
            className="w-full h-2 rounded-full mt-2"
            style={{ background: "var(--card2)" }}
          >
            <div
              className="h-2 rounded-full"
              style={{
                width: `${progress}%`,
                background: "var(--primary)",
              }}
            />
          </div>

          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            {stats.weekNew}/{stats.goalNew}
          </p>
        </Card>

        <Card>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Từ mới
          </p>
          <p className="text-3xl font-bold text-[var(--primary)]">
            {stats.weekNew}
          </p>
        </Card>

        <Card>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Ôn tập
          </p>
          <p className="text-3xl font-bold">{stats.weekReview}</p>
        </Card>

        <Card>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Chuỗi
          </p>
          <p className="text-3xl font-bold">🔥 {stats.streak}</p>
        </Card>
      </div>

      {/* ================= CHART ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* LINE CHART */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-3">📈 7 ngày gần nhất</h3>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="lineColor">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.4}
              />

              <XAxis dataKey="day" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />

              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                }}
              />

              <Line
                type="monotone"
                dataKey="words"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "var(--primary)",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* PIE CHART */}
        <Card>
          <h3 className="font-semibold mb-3">🎯 TOPIK</h3>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                stroke="none"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>

              {/* CENTER */}
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                fontSize="20"
                fill="var(--text)"
                fontWeight="bold"
              >
                {topik.level12 + topik.level34}
              </text>

              <text
                x="50%"
                y="60%"
                textAnchor="middle"
                fontSize="12"
                fill="var(--muted)"
              >
                Total
              </text>

              <Tooltip
                formatter={(value, name) => [`${value} từ`, name]}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex justify-center gap-4 mt-2 text-xs">
            <span style={{ color: "var(--primary)" }}>■ TOPIK I</span>
            <span style={{ color: "var(--muted)" }}>■ TOPIK II</span>
          </div>
        </Card>

        {/* GOAL */}
        <Card>
          <h3 className="font-semibold mb-3">🎯 Mục tiêu</h3>

          <div className="space-y-3 text-sm">
            <Row label="Từ mới" value={weekGoal.new} />
            <Row label="Ôn tập" value={weekGoal.review} />
            <Row label="Bài tập" value={weekGoal.exercise} />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================= helper ================= */
function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span>
        {value.current}/{value.total}
      </span>
    </div>
  );
}
