import { useEffect, useState } from "react";
import Card from "../components/common/Card";

export default function Stats() {
  const [statsData, setStatsData] = useState({
    totalWords: 0,
    masteredWords: 0,
    weakWords: 0,
    avgScore: 0,
  });

  const [weeklyScore, setWeeklyScore] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setStatsData({
          totalWords: data?.totalWords ?? 0,
          masteredWords: data?.masteredWords ?? 0,
          weakWords: data?.weakWords ?? 0,
          avgScore: data?.avgScore ?? 0,
        });

        setWeeklyScore(data?.weeklyScore ?? []);
      })
      .catch((err) => console.log("Stats API error:", err));
  }, []);

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 rounded-2xl">
        <h1 className="text-2xl font-bold">📊 Thống kê học tập</h1>
        <p className="text-white/80">Theo dõi tiến độ học từ vựng TOPIK</p>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3 className="font-semibold">Tổng từ</h3>
          <p className="text-3xl font-bold mt-2">{statsData.totalWords}</p>
        </Card>

        <Card>
          <h3 className="font-semibold">Đã thuộc</h3>
          <p className="text-3xl font-bold mt-2 text-green-500">
            {statsData.masteredWords}
          </p>
        </Card>

        <Card>
          <h3 className="font-semibold">Cần ôn</h3>
          <p className="text-3xl font-bold mt-2 text-red-500">
            {statsData.weakWords}
          </p>
        </Card>

        <Card>
          <h3 className="font-semibold">Điểm TB</h3>
          <p className="text-3xl font-bold mt-2 text-purple-500">
            {statsData.avgScore}
          </p>
        </Card>
      </div>

      {/* ================= CHART ================= */}
      <Card>
        <h3 className="font-semibold mb-3">Điểm 7 ngày gần nhất</h3>

        <div className="h-40 flex items-end gap-2">
          {weeklyScore.length > 0 ? (
            weeklyScore.map((value, index) => (
              <div
                key={index}
                className="flex-1 bg-indigo-400 rounded-t-lg"
                style={{ height: `${value * 5}px` }}
              />
            ))
          ) : (
            <p className="text-gray-400">Chưa có dữ liệu</p>
          )}
        </div>
      </Card>
    </div>
  );
}
