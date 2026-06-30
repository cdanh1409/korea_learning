import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import Card from "../components/common/Card";

import api from "../utils/api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const safeNumber = (v) => (isNaN(Number(v)) ? 0 : Number(v));

const COLORS = ["#6366f1", "#06b6d4"];

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState("");

  const [stats, setStats] = useState({
    newWords: 0,

    reviewedWords: 0,

    streak: 0,
  });

  const [weeklyData, setWeeklyData] = useState([]);

  const [topik, setTopik] = useState({
    level12: 0,

    level34: 0,
  });

  const [weekGoal, setWeekGoal] = useState({
    new: {
      current: 0,

      total: 60,
    },

    review: {
      current: 0,

      total: 50,
    },

    exercise: {
      current: 0,

      total: 20,
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });

      return;
    }

    const fetchDashboard = async () => {
      try {
        const [dashboardRes, profileRes] = await Promise.all([
          api.get("/dashboard/summary"),

          api.get("/user/profile"),
        ]);

        const data = dashboardRes.data || {};

        setUser(profileRes.data?.fullName || "User");

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

            total: safeNumber(data?.weekGoal?.new?.total || 60),
          },

          review: {
            current: safeNumber(data?.weekGoal?.review?.current),

            total: safeNumber(data?.weekGoal?.review?.total || 50),
          },

          exercise: {
            current: safeNumber(data?.weekGoal?.exercise?.current),

            total: safeNumber(data?.weekGoal?.exercise?.total || 20),
          },
        });
      } catch (err) {
        console.log(err);

        if (err?.response?.status === 401) {
          localStorage.removeItem("token");

          navigate("/login", {
            replace: true,
          });
        }
      }
    };

    fetchDashboard();
  }, [navigate]);

  const progress = useMemo(() => {
    if (!weekGoal.review.total) return 0;

    return Math.min(
      100,
      Math.round((weekGoal.review.current / weekGoal.review.total) * 100),
    );
  }, [weekGoal.review.current, weekGoal.review.total]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const d = new Date();

      d.setDate(d.getDate() - (6 - index));

      return {
        day: d.toLocaleDateString("vi-VN", {
          weekday: "short",
        }),

        reviews: safeNumber(weeklyData[index]),
      };
    });
  }, [weeklyData]);

  const level12 = safeNumber(topik.level12);

  const level34 = safeNumber(topik.level34);

  const totalTopik = level12 + level34;

  const pieData =
    totalTopik === 0
      ? [{ name: "Empty", value: 1 }]
      : [
          {
            name: "TOPIK I",

            value: level12,
          },

          {
            name: "TOPIK II",

            value: level34,
          },
        ];

  return (
    <div className="min-h-screen p-5 space-y-5 bg-[var(--bg)] text-[var(--text)]">
      {/* HERO */}

      <div
        className="

        relative

        overflow-hidden

        rounded-3xl

        border

        bg-[var(--card)]

        px-8

        py-8

        flex

        justify-between

        items-center

      "
      >
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{
            background: "var(--primary)",
          }}
        />

        <div className="z-10 max-w-2xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[var(--card2)]">
            🇰🇷 Korean Learning AI
          </span>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
            Xin chào, {user} 👋
          </h1>

          <p className="mt-5 leading-8 text-[var(--muted)]">
            Chào mừng bạn quay trở lại.
            <br />
            Học từ vựng tiếng Hàn theo phương pháp
            <span className="font-bold text-[var(--primary)]">
              {" "}
              Spaced Repetition
            </span>
            , theo dõi tiến độ và luyện tập mỗi ngày để đạt mục tiêu TOPIK.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <button
              onClick={() => navigate("/learn")}
              className="px-5 py-3 rounded-xl font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition"
            >
              Bắt đầu học
            </button>

            <button
              onClick={() => navigate("/review")}
              className="px-5 py-3 rounded-xl border hover:bg-[var(--card2)] transition"
            >
              Ôn tập
            </button>
          </div>
        </div>

        <div className="hidden lg:flex relative z-10">
          <img
            src="http://localhost:5000/images/dashboard.png"
            alt="Dashboard"
            className="w-72 object-contain select-none pointer-events-none"
            style={{
              filter: "drop-shadow(0 20px 40px rgba(99,102,241,.35))",
            }}
          />
        </div>
      </div>

      {/* STATS */}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="transition hover:-translate-y-1 hover:shadow-xl">
          <p className="text-sm opacity-70">Tiến độ tuần</p>

          <div className="mt-3 flex items-end justify-between">
            <h2 className="text-3xl font-bold">{progress}%</h2>

            <span className="text-xs opacity-60">mục tiêu</span>
          </div>

          <div className="mt-5 h-3 rounded-full bg-[var(--card2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </Card>

        <Card className="transition hover:-translate-y-1 hover:shadow-xl">
          <p className="text-sm opacity-70">Từ chưa học</p>

          <h2 className="mt-4 text-3xl font-bold">{stats.newWords}</h2>

          <p className="mt-3 text-xs opacity-60">Từ mới đang chờ bạn học</p>
        </Card>

        <Card className="transition hover:-translate-y-1 hover:shadow-xl">
          <p className="text-sm opacity-70">Đã học (7 ngày)</p>

          <h2 className="mt-4 text-3xl font-bold">{stats.reviewedWords}</h2>

          <p className="mt-3 text-xs opacity-60">Tổng số từ đã ôn tập</p>
        </Card>

        <Card className="transition hover:-translate-y-1 hover:shadow-xl">
          <p className="text-sm opacity-70">Chuỗi học</p>

          <h2 className="mt-4 text-3xl font-bold">🔥 {stats.streak}</h2>

          <p className="mt-3 text-xs opacity-60">Hãy duy trì mỗi ngày</p>
        </Card>
      </div>

      {/* CHARTS */}

      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
        <Card className="xl:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-lg">
              Thống kê học tập 7 ngày gần nhất
            </h3>

            <span className="text-xs opacity-60">7 ngày</span>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid opacity={0.15} />

              <XAxis dataKey="day" />

              <YAxis />

              <Tooltip />

              <Line
                dataKey="reviews"
                type="monotone"
                stroke="#6366f1"
                strokeWidth={4}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 7,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* PIE CHART */}

        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg">Phân bố từ đã học</h3>

            <span className="text-xs opacity-60">TOPIK</span>
          </div>

          {totalTopik === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm opacity-60">
              Chưa có dữ liệu TOPIK
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                >
                  {pieData.map((item, index) => (
                    <Cell key={item.name} fill={COLORS[index]} />
                  ))}
                </Pie>

                <text
                  x="50%"
                  y="47%"
                  textAnchor="middle"
                  fontSize={28}
                  fontWeight="700"
                  fill="var(--text)"
                >
                  {totalTopik}
                </text>

                <text
                  x="50%"
                  y="61%"
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

          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: COLORS[0],
                }}
              />

              <span className="text-sm">TOPIK I ({level12})</span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: COLORS[1],
                }}
              />

              <span className="text-sm">TOPIK II ({level34})</span>
            </div>
          </div>
        </Card>

        {/* GOAL */}

        <Card>
          <h3 className="font-bold text-lg mb-5">Mục tiêu tuần</h3>

          <GoalRow label="Đã học" value={weekGoal.review} />

          <GoalRow label="Từ mới" value={weekGoal.new} />

          <GoalRow label="Bài tập" value={weekGoal.exercise} />

          <div className="mt-8">
            <div className="flex justify-between text-sm mb-2">
              <span>Hoàn thành</span>

              <span>{progress}%</span>
            </div>

            <div className="h-3 rounded-full bg-[var(--card2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-[var(--card2)] p-4">
            <p className="font-semibold">💡 Gợi ý hôm nay</p>

            <p className="text-sm mt-2 opacity-70 leading-6">
              Hãy hoàn thành ít nhất
              <strong> 20 từ ôn tập </strong>
              để duy trì chuỗi học và tăng khả năng ghi nhớ.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function GoalRow({ label, value }) {
  const current = safeNumber(value?.current);

  const total = safeNumber(value?.total);

  const percent =
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>

        <span className="text-sm opacity-70">
          {current}/{total}
        </span>
      </div>

      <div className="h-2 rounded-full bg-[var(--card2)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}
