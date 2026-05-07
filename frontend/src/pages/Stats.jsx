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

// ================= COLORS =================
const COLORS = {
  primary: "var(--primary)",
  warning: "var(--warning)",
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
        console.log(err);
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

  const totalTopik = statsData.totalWords;

  // ================= CHART =================
  const trendData = useMemo(() => {
    return weeklyScore.map((v, i) => ({
      day: `D${i + 1}`,
      score: safeNumber(v),
    }));
  }, [weeklyScore]);

  // ================= PIE (FIXED) =================
  const pieData = useMemo(() => {
    const mastered = Math.min(statsData.masteredWords, statsData.totalWords);

    const remaining = Math.max(statsData.totalWords - mastered, 0);

    return [
      { name: "Đã thuộc", value: mastered },
      { name: "Cần ôn", value: remaining },
    ];
  }, [statsData]);

  // ================= INSIGHT =================
  const insight = useMemo(() => {
    if (progress >= 80) return "🔥 Rất tốt";
    if (progress >= 50) return "📈 Ổn định";
    if (progress >= 20) return "⚠️ Cần cải thiện";
    return "🧠 Bắt đầu học";
  }, [progress]);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="p-3">
        <Card>⏳ Loading...</Card>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-3 bg-[var(--bg)] text-[var(--text)] min-h-screen">
      {/* ERROR */}
      {error && (
        <Card>
          <p className="text-red-500 text-sm">❌ {error}</p>
        </Card>
      )}

      {/* HEADER */}
      <Card>
        <h2 className="text-sm font-semibold">TOPIK Stats</h2>
        <p className="text-xs text-[var(--muted)]">{insight}</p>
      </Card>

      {/* GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card>
          <p className="text-xs text-[var(--muted)]">Tổng</p>
          <h2 className="text-xl font-bold">{statsData.totalWords}</h2>
        </Card>

        <Card>
          <p className="text-xs text-[var(--muted)]">Đã thuộc</p>
          <h2 className="text-xl font-bold text-green-500">
            {statsData.masteredWords}
          </h2>
        </Card>

        <Card>
          <p className="text-xs text-[var(--muted)]">Cần ôn</p>
          <h2 className="text-xl font-bold text-orange-500">
            {statsData.totalWords - statsData.masteredWords}
          </h2>
        </Card>

        <Card>
          <p className="text-xs text-[var(--muted)]">Avg</p>
          <h2 className="text-xl font-bold text-blue-500">
            {Number(statsData.avgScore).toFixed(1)}
          </h2>
        </Card>
      </div>

      {/* PROGRESS */}
      <Card>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[var(--muted)]">Progress</span>
          <span>{progress}%</span>
        </div>

        <div className="h-2 bg-[var(--card2)] rounded-full overflow-hidden">
          <div
            className="h-2 bg-[var(--primary)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-3">
        {/* BAR */}
        <Card>
          <h3 className="text-sm mb-2">📈 Weekly</h3>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData}>
              <CartesianGrid stroke={COLORS.border} opacity={0.2} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="score"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* PIE */}
        <Card>
          <h3 className="text-sm mb-2">📊 Distribution</h3>

          <div className="flex items-center gap-3">
            <PieChart width={180} height={180}>
              <Pie
                data={pieData}
                innerRadius={40}
                outerRadius={60}
                dataKey="value"
              >
                <Cell fill="var(--primary)" />
                <Cell fill="var(--warning)" />
              </Pie>
            </PieChart>

            <div className="text-xs space-y-1">
              <div>Total: {totalTopik}</div>

              {pieData.map((d, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: i === 0 ? "var(--primary)" : "var(--warning)",
                    }}
                  />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
