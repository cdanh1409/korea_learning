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

export default function Stats() {
  const [statsData, setStatsData] = useState({
    totalWords: 0,
    masteredWords: 0,
    weakWords: 0,
    newWords: 0,
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
          newWords: data?.newWords ?? 0,
          avgScore: data?.avgScore ?? 0,
        });

        setWeeklyScore(
          Array.isArray(data?.weeklyScore) ? data.weeklyScore : [],
        );
        setError("");
      } catch (err) {
        console.log(err);
        setError("Không tải được dữ liệu");

        setStatsData({
          totalWords: 0,
          masteredWords: 0,
          weakWords: 0,
          newWords: 0,
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

  const progress = useMemo(() => {
    return statsData.totalWords > 0
      ? Math.round((statsData.masteredWords / statsData.totalWords) * 100)
      : 0;
  }, [statsData]);

  const remainingWords = useMemo(() => {
    return Math.max(
      statsData.totalWords -
        statsData.masteredWords -
        statsData.weakWords -
        statsData.newWords,
      0,
    );
  }, [statsData]);

  const insight = useMemo(() => {
    if (progress >= 80) return "🔥 Bạn đang làm rất tốt";
    if (progress >= 50) return "📈 Đang tiến bộ ổn định";
    if (progress >= 20) return "⚠️ Cần luyện thêm";
    return "🧠 Hãy bắt đầu đều đặn";
  }, [progress]);

  // ================= CHART =================
  const trendData = useMemo(() => {
    return weeklyScore.map((v, i) => ({
      day: `D${i + 1}`,
      score: safeNumber(v),
    }));
  }, [weeklyScore]);

  // ================= PIE (FIXED SRS MODEL) =================
  const pieData = useMemo(() => {
    return [
      { name: "Đã thuộc", value: statsData.masteredWords },
      { name: "Cần ôn", value: statsData.weakWords },
      { name: "Mới", value: statsData.newWords },
      { name: "Chưa học", value: remainingWords },
    ];
  }, [statsData, remainingWords]);

  const totalWords = statsData.totalWords;

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="p-2 space-y-3">
        <Card>
          <div className="h-4 w-1/3 bg-[var(--card2)] animate-pulse rounded" />
          <div className="h-3 w-1/2 mt-2 bg-[var(--card2)] animate-pulse rounded" />
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="h-6 w-1/2 bg-[var(--card2)] animate-pulse rounded" />
              <div className="h-4 w-1/3 mt-2 bg-[var(--card2)] animate-pulse rounded" />
            </Card>
          ))}
        </div>

        <Card>
          <div className="h-[200px] bg-[var(--card2)] animate-pulse rounded" />
        </Card>
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
          <h2 className="text-xl font-bold">{totalWords}</h2>
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
            {statsData.weakWords}
          </h2>
        </Card>

        <Card>
          <p className="text-xs text-[var(--muted)]">Mới</p>
          <h2 className="text-xl font-bold text-blue-500">
            {statsData.newWords}
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
            className="h-2 bg-[var(--primary)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-3">
        {/* BAR */}
        <Card>
          <h3 className="text-sm mb-2">📈 Weekly</h3>

          {trendData.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">Không có dữ liệu tuần</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <CartesianGrid opacity={0.2} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* PIE */}
        <Card>
          <h3 className="text-sm mb-2">📊 Distribution</h3>

          <div className="flex items-center gap-3">
            <PieChart width={180} height={180}>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={45}
                outerRadius={65}
              >
                <Cell fill="var(--primary)" />
                <Cell fill="var(--warning)" />
                <Cell fill="blue" />
                <Cell fill="gray" />
              </Pie>
            </PieChart>

            <div className="text-xs space-y-1">
              <div>Total: {totalWords}</div>

              {pieData.map((d, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        i === 0
                          ? "var(--primary)"
                          : i === 1
                            ? "var(--warning)"
                            : i === 2
                              ? "blue"
                              : "gray",
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
