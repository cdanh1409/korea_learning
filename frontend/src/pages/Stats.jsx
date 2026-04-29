import { useEffect, useMemo, useState } from "react";
import Card from "../components/common/Card";
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
} from "recharts";

export default function Stats() {
  const [statsData, setStatsData] = useState({
    totalWords: 0,
    masteredWords: 0,
    weakWords: 0,
    avgScore: 0,
  });

  const [weeklyScore, setWeeklyScore] = useState([]);

  // ================= LOAD =================
  useEffect(() => {
    fetch("http://localhost:5000/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStatsData({
          totalWords: data?.totalWords ?? 0,
          masteredWords: data?.masteredWords ?? 0,
          weakWords: data?.weakWords ?? 0,
          avgScore: data?.avgScore ?? 0,
        });

        setWeeklyScore(data?.weeklyScore ?? []);
      })
      .catch(console.log);
  }, []);

  // ================= DERIVED =================
  const progress =
    statsData.totalWords > 0
      ? Math.round((statsData.masteredWords / statsData.totalWords) * 100)
      : 0;

  const trendData = useMemo(() => {
    return Array.isArray(weeklyScore)
      ? weeklyScore.map((v, i) => ({
          day: `D${i + 1}`,
          score: v,
        }))
      : [];
  }, [weeklyScore]);

  // ===== PIE DATA (DONUT) =====
  const total = statsData.masteredWords + statsData.weakWords;

  const pieData = [
    { name: "TOPIK I (1-2)", value: statsData.masteredWords },
    { name: "TOPIK II (3-4)", value: statsData.weakWords },
  ];

  const COLORS = ["#4f7cff", "#ff7a2f"];

  const renderLabel = ({ percent }) => `${(percent * 100).toFixed(1)}%`;

  const avgLevel =
    statsData.avgScore >= 7
      ? "text-green-500"
      : statsData.avgScore >= 4
        ? "text-yellow-500"
        : "text-red-500";

  const insight = useMemo(() => {
    if (progress >= 80) return "🔥 Bạn đang học rất tốt!";
    if (progress >= 50) return "📈 Tiến độ ổn định, giữ nhịp!";
    if (progress >= 20) return "⚠️ Cần tăng tần suất học!";
    return "🧠 Hãy bắt đầu học đều hơn!";
  }, [progress]);

  return (
    <div className="p-6 space-y-6 w-full bg-[var(--bg)] text-[var(--text)]">
      {/* TOP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <h3 className="font-semibold mb-2">🧠 AI Insight</h3>
          <p style={{ color: "var(--muted)" }}>{insight}</p>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">📌 Breakdown</h3>
          <div className="space-y-2 text-sm">
            <Row label="Mastery Rate" value={`${progress}%`} />
            <Row
              label="Weak Ratio"
              value={`${Math.round(
                (statsData.weakWords / (statsData.totalWords || 1)) * 100,
              )}%`}
            />
            <Row label="Avg Score" value={statsData.avgScore.toFixed(1)} />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">🎯 Status</h3>
          <p style={{ color: "var(--muted)" }}>
            {progress >= 80
              ? "Bạn đang ở level cao 👍"
              : progress >= 50
                ? "Đang tiến bộ ổn định 📈"
                : "Cần học đều hơn 🚀"}
          </p>
        </Card>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p style={{ color: "var(--muted)" }}>Tổng từ</p>
          <h2 className="text-3xl font-bold">{statsData.totalWords}</h2>
        </Card>

        <Card>
          <p style={{ color: "var(--muted)" }}>Đã thuộc</p>
          <h2 className="text-3xl font-bold text-green-500">
            {statsData.masteredWords}
          </h2>
        </Card>

        <Card>
          <p style={{ color: "var(--muted)" }}>Cần ôn</p>
          <h2 className="text-3xl font-bold text-red-500">
            {statsData.weakWords}
          </h2>
        </Card>

        <Card>
          <p style={{ color: "var(--muted)" }}>Điểm TB</p>
          <h2 className={`text-3xl font-bold ${avgLevel}`}>
            {statsData.avgScore.toFixed(1)}
          </h2>
        </Card>
      </div>

      {/* PROGRESS */}
      <Card>
        <div className="flex justify-between mb-2">
          <span style={{ color: "var(--muted)" }}>Mastery Progress</span>
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

      {/* ==== 2 CARD RIÊNG ==== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BAR CARD */}
        <Card>
          <h3 className="font-semibold mb-4">📈 Weekly Performance</h3>

          <div className="overflow-x-auto">
            {trendData.length > 0 ? (
              <BarChart width={600} height={300} data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip />
                <Bar dataKey="score" fill="var(--primary)" />
              </BarChart>
            ) : (
              <p style={{ color: "var(--muted)" }}>Chưa có dữ liệu biểu đồ</p>
            )}
          </div>
        </Card>

        {/* PIE CARD */}
        <Card>
          <h3 className="font-semibold mb-4">📊 Phân bố trình độ</h3>

          <div className="flex justify-center items-center gap-6">
            <PieChart width={350} height={300}>
              <Pie
                data={pieData}
                cx="40%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={renderLabel}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>

            {/* LEGEND CUSTOM */}
            <div className="space-y-2 text-sm">
              {pieData.map((item, index) => {
                const percent =
                  total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

                return (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: COLORS[index] }}
                    />
                    <span>
                      <b>{item.name}</b> &nbsp; {percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
