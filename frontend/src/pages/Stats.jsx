import { useEffect, useMemo, useState } from "react";
import Card from "../components/common/Card";
import api from "../utils/api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

// ================= SAFE =================
const safeNumber = (v) => (isNaN(Number(v)) ? 0 : Number(v));

// ================= THEME COLORS =================
const COLORS = {
  primary: "var(--primary)",
  warning: "var(--warning)",
  text: "var(--text)",
  muted: "var(--muted)",
  border: "var(--border)",
};

export default function Stats() {
  const [statsData, setStatsData] = useState({
    totalWords: 0,
    masteredWords: 0,
    weakWords: 0,
    avgScore: 0,
  });

  const [weeklyScore, setWeeklyScore] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= FETCH =================
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const res = await api.get("/stats");
        const data = res.data;

        setStatsData({
          totalWords: data?.totalWords ?? 0,
          masteredWords: data?.masteredWords ?? 0,
          weakWords: data?.weakWords ?? 0,
          avgScore: data?.avgScore ?? 0,
        });

        setWeeklyScore(data?.weeklyScore ?? []);
        setError("");
      } catch (err) {
        console.log("Stats error:", err);
        setError("Không tải được dữ liệu");

        setStatsData({
          totalWords: 0,
          masteredWords: 0,
          weakWords: 0,
          avgScore: 0,
        });

        setWeeklyScore([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // ================= CALC =================
  const progress =
    statsData.totalWords > 0
      ? Math.round((statsData.masteredWords / statsData.totalWords) * 100)
      : 0;

  const totalTopik = statsData.masteredWords + statsData.weakWords;

  // ================= CHART DATA =================
  const trendData = useMemo(() => {
    return Array.isArray(weeklyScore)
      ? weeklyScore.map((v, i) => ({
          day: `D${i + 1}`,
          score: safeNumber(v),
        }))
      : [];
  }, [weeklyScore]);

  // ================= PIE DATA (TOPIK) =================
  const pieData = [
    {
      name: "TOPIK I",
      value: statsData.masteredWords,
    },
    {
      name: "TOPIK II",
      value: statsData.weakWords,
    },
  ];

  // ================= INSIGHT =================
  const insight = useMemo(() => {
    if (progress >= 80) return "🔥 Học rất tốt!";
    if (progress >= 50) return "📈 Ổn định!";
    if (progress >= 20) return "⚠️ Cần cố gắng!";
    return "🧠 Bắt đầu học đi!";
  }, [progress]);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="p-6">
        <Card>⏳ Đang tải thống kê...</Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* ERROR */}
      {error && (
        <Card>
          <p className="text-red-500">❌ {error}</p>
        </Card>
      )}

      {/* HEADER */}
      <Card>
        <h2 className="text-xl font-bold">📊 TOPIK Statistics</h2>
        <p style={{ color: COLORS.muted }}>{insight}</p>
      </Card>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p style={{ color: COLORS.muted }}>Tổng từ</p>
          <h2 className="text-3xl font-bold">{statsData.totalWords}</h2>
        </Card>

        <Card>
          <p style={{ color: COLORS.muted }}>TOPIK I</p>
          <h2 className="text-3xl font-bold text-green-500">
            {statsData.masteredWords}
          </h2>
        </Card>

        <Card>
          <p style={{ color: COLORS.muted }}>TOPIK II</p>
          <h2 className="text-3xl font-bold text-orange-500">
            {statsData.weakWords}
          </h2>
        </Card>

        <Card>
          <p style={{ color: COLORS.muted }}>Điểm TB</p>
          <h2 className="text-3xl font-bold text-blue-500">
            {Number(statsData.avgScore).toFixed(1)}
          </h2>
        </Card>
      </div>

      {/* PROGRESS */}
      <Card>
        <div className="flex justify-between mb-2">
          <span style={{ color: COLORS.muted }}>Progress</span>
          <span className="font-bold">{progress}%</span>
        </div>

        <div className="w-full h-2 rounded-full bg-[var(--card2)] overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "var(--primary)",
            }}
          />
        </div>
      </Card>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BAR CHART */}
        <Card>
          <h3 className="font-semibold mb-4">📈 Weekly Performance</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid stroke={COLORS.border} opacity={0.3} />
              <XAxis dataKey="day" stroke={COLORS.muted} />
              <YAxis stroke={COLORS.muted} />

              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  borderRadius: "10px",
                }}
              />

              <Bar
                dataKey="score"
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* PIE CHART */}
        <Card>
          <h3 className="font-semibold mb-4">📊 TOPIK Distribution</h3>

          <div className="flex flex-col lg:flex-row items-center gap-6">
            <PieChart width={260} height={260}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="var(--primary)" />
                <Cell fill="var(--warning)" />
              </Pie>

              {/* TOOLTIP DETAIL */}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;

                  const data = payload[0];
                  const percent =
                    totalTopik > 0
                      ? Math.round((data.value / totalTopik) * 100)
                      : 0;

                  return (
                    <div
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        color: "var(--text)",
                      }}
                    >
                      <p className="font-semibold">{data.name}</p>
                      <p style={{ color: COLORS.muted }}>{data.value} từ</p>
                      <p style={{ color: "var(--primary)" }}>{percent}%</p>
                    </div>
                  );
                }}
              />
            </PieChart>

            {/* CENTER */}
            <div className="text-center">
              <p style={{ color: COLORS.muted }}>TOPIK Total</p>
              <h2 className="text-3xl font-bold">{totalTopik}</h2>
            </div>

            {/* LEGEND */}
            <div className="text-sm space-y-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: i === 0 ? "var(--primary)" : "var(--warning)",
                    }}
                  />
                  <span>
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
