import { useEffect, useMemo, useRef, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import useSettings from "../hooks/useSettings";
import api from "../utils/api";

const COLORS = ["var(--primary)", "var(--warning)"];

const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "topik1", label: "TOPIK I" },
  { key: "topik2", label: "TOPIK II" },
  { key: "beginner", label: "Sơ cấp" },
  { key: "intermediate", label: "Trung cấp" },
  { key: "advanced", label: "Cao cấp" },
];

const topicImage = {
  1: "family.png",
  2: "school.png",
  3: "food.png",
  4: "greeting.png",
  5: "job.png",
  6: "travel.png",
};

const API_URL = "http://localhost:5000";

export default function Learn() {
  const { settings } = useSettings();

  const [topics, setTopics] = useState([]);
  const [words, setWords] = useState([]);

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isLearning, setIsLearning] = useState(false);

  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState("all");
  const [flipped, setFlipped] = useState(false);

  const prevIdRef = useRef(null);
  const flipTimerRef = useRef(null);
  const speechRef = useRef(null);

  const [stats, setStats] = useState({
    easy: 0,
    hard: 0,
    normal: 0,
    again: 0,
    total: 0,
  });

  // ================= SAFE WORDS =================
  const safeWords = useMemo(() => {
    return Array.isArray(words) ? words : [];
  }, [words]);

  const current = safeWords[index] ?? null;

  const finished = safeWords.length > 0 && index >= safeWords.length;

  // ================= LOAD TOPICS =================
  useEffect(() => {
    api
      .get("/topics")
      .then((res) => {
        setTopics(res.data || []);
      })
      .catch(console.log);
  }, []);

  // ================= LOAD WORDS =================
  useEffect(() => {
    if (!selectedTopic) return;

    api
      .get("/vocabularies", {
        params: {
          topicId: selectedTopic,
        },
      })
      .then((res) => {
        const data = res.data || [];
        console.log("VOCAB API:", res.data);
        setWords(data);

        setIndex(0);
        setFlipped(false);

        setIsLearning(true);

        setStats({
          easy: 0,
          hard: 0,
          normal: 0,
          again: 0,
          total: 0,
        });
      })
      .catch(console.log);
  }, [selectedTopic]);

  // ================= FILTER =================
  const filteredTopics = useMemo(() => {
    return (topics || []).filter((t) => {
      const level = Number(t.Level ?? 0);

      switch (filter) {
        case "topik1":
        case "beginner":
          return level >= 1 && level <= 2;

        case "topik2":
          return level >= 3;

        case "intermediate":
          return level >= 3 && level <= 4;

        case "advanced":
          return level >= 5 && level <= 6;

        default:
          return true;
      }
    });
  }, [topics, filter]);

  // ================= RESET FLIP =================
  useEffect(() => {
    if (prevIdRef.current !== current?.Id) {
      setFlipped(false);

      prevIdRef.current = current?.Id;
    }
  }, [current?.Id]);

  // ================= AUTO SPEAK =================
  useEffect(() => {
    if (!current || !flipped || !settings?.autoPlayAudio) {
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(current.Word || "");

    utter.lang = "ko-KR";

    speechRef.current = utter;

    const t = setTimeout(() => {
      window.speechSynthesis.speak(utter);
    }, 100);

    return () => clearTimeout(t);
  }, [flipped, current?.Id, settings?.autoPlayAudio]);

  // ================= AUTO FLIP =================
  useEffect(() => {
    if (!settings?.autoFlip || flipped || !current || finished) {
      return;
    }

    flipTimerRef.current = setTimeout(() => {
      setFlipped(true);
    }, settings?.autoFlipTime || 4000);

    return () => clearTimeout(flipTimerRef.current);
  }, [flipped, current?.Id, settings, finished]);

  // ================= ACTIONS =================
  const nextWord = () => {
    setIndex((p) => p + 1);
  };

  const handleSelectTopic = (id) => {
    setSelectedTopic(id);

    setIndex(0);
    setFlipped(false);

    setIsLearning(false);
  };

  const handleBack = () => {
    setSelectedTopic(null);

    setIsLearning(false);

    setWords([]);

    setIndex(0);

    setFlipped(false);

    window.speechSynthesis?.cancel();
  };

  const handleSRS = async (level) => {
    if (!current?.Id) return;

    try {
      await api.post("/vocabularies/review", {
        id: current.Id,
        level,
      });

      setStats((prev) => ({
        ...prev,
        [level]: prev[level] + 1,
        total: prev.total + 1,
      }));

      nextWord();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= STATS =================
  const learned = stats.total;

  const left = Math.max(safeWords.length - index, 0);

  const progress = safeWords.length
    ? Math.round((learned / safeWords.length) * 100)
    : 0;

  const accuracy = learned
    ? Math.round(((stats.easy + stats.normal) / learned) * 100)
    : 0;

  const topic = topics.find((t) => t.Id === selectedTopic);

  const topicName = topic?.Name || "—";

  const levelText =
    (topic?.Level ?? 0) <= 2
      ? "TOPIK I"
      : (topic?.Level ?? 0) <= 4
        ? "TOPIK II"
        : "—";

  const progressData = [
    {
      name: "done",
      value: learned,
    },
    {
      name: "left",
      value: left,
    },
  ];

  // ================= FINISH =================
  if (finished && isLearning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)] px-4">
        <div className="w-full max-w-md p-6 rounded-2xl border bg-[var(--card)] text-center space-y-5">
          <div className="text-5xl">🎉</div>

          <h1 className="text-2xl font-bold">Hoàn thành bài học</h1>

          <div className="grid grid-cols-4 gap-2 text-xs">
            {["easy", "normal", "hard", "again"].map((k) => (
              <div key={k} className="p-3 rounded-xl bg-black/5">
                <p className="text-lg font-bold">{stats[k]}</p>

                <p>{k}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleBack}
            className="w-full py-2 rounded-xl text-white"
            style={{
              background: "var(--primary)",
            }}
          >
            Chọn chủ đề khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-5 bg-[var(--bg)] text-[var(--text)]">
      {" "}
      <div className="max-w-5xl mx-auto space-y-4">
        {/* ================= HERO ================= */}
        {!isLearning && (
          <div
            className="
              relative overflow-hidden
              rounded-3xl border
              p-4 md:p-5
            "
            style={{
              background:
                "linear-gradient(135deg, var(--card) 0%, var(--card2) 100%)",

              borderColor: "var(--border)",
            }}
          >
            {/* GLOW */}
            <div
              className="
                absolute -top-24 -right-24
                w-72 h-72 rounded-full
                blur-3xl opacity-20
              "
              style={{
                background: "var(--primary)",
              }}
            />

            <div
              className="
                relative z-10
                flex flex-col lg:flex-row
                items-center justify-between
                gap-6
              "
            >
              {/* LEFT */}
              <div className="max-w-xl">
                <p
                  className="
                    text-xs font-bold uppercase
                    tracking-[0.25em]
                  "
                  style={{
                    color: "var(--primary)",
                  }}
                >
                  Bắt đầu học
                </p>

                <h1
                  className="
                    mt-3
                    text-3xl md:text-4xl
                    font-black italic
                    leading-tight
                  "
                >
                  Học từ vựng thông minh với AI
                </h1>

                <p
                  className="
                    mt-3
                    text-sm md:text-base
                    leading-7
                    font-medium
                    text-[var(--muted)]
                  "
                >
                  AI sẽ giúp bạn học từ vựng thông minh hơn, ghi nhớ lâu hơn và
                  đúng trọng tâm TOPIK!
                </p>
              </div>

              {/* IMAGE */}
              <div className="flex justify-center">
                <img
                  src={`${API_URL}/images/learn.png`}
                  alt="Learn"
                  className="
                    w-[160px] md:w-[220px]
                    object-contain
                    drop-shadow-2xl
                    select-none
                    pointer-events-none
                  "
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= FILTER ================= */}
        {!isLearning && (
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="
                  px-4 py-2
                  text-sm font-medium
                  rounded-full border
                  transition-all
                "
                style={{
                  background:
                    filter === f.key ? "var(--primary)" : "var(--card)",

                  color: filter === f.key ? "#fff" : "var(--text)",

                  borderColor: "var(--border)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* ================= TOPICS ================= */}
        {!isLearning && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTopics.map((t) => {
              const imageUrl = `${API_URL}/images/${topicImage[t.Id]}`;

              return (
                <div
                  key={t.Id}
                  onClick={() => handleSelectTopic(t.Id)}
                  className="
                    group
                    relative overflow-hidden
                    rounded-3xl border
                    bg-[var(--card)]
                    cursor-pointer
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:shadow-2xl
                  "
                  style={{
                    borderColor: "var(--border)",
                  }}
                >
                  {/* IMAGE */}
                  <div className="h-[190px] overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={t.Name}
                      className="
                        w-full h-full object-cover
                        transition-transform duration-500
                        group-hover:scale-110
                      "
                      // onError={(e) => {
                      //   e.target.src = "/no-image.png";
                      // }}
                    />
                  </div>

                  {/* DARK OVERLAY */}
                  <div
                    className="
                      absolute inset-0
                      bg-gradient-to-t
                      from-black/80
                      via-black/10
                      to-transparent
                    "
                  />

                  {/* CONTENT */}
                  <div className="absolute bottom-0 left-0 p-5 z-10 text-white">
                    <h3 className="font-black text-2xl drop-shadow-lg">
                      {t.Name}
                    </h3>

                    <p className="text-sm opacity-90 mt-1">
                      TOPIK Level {t.Level}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= LEARNING ================= */}
        {isLearning && safeWords.length > 0 && current && (
          <div className="grid lg:grid-cols-3 gap-4">
            {/* CARD */}
            <div className="lg:col-span-2 flex flex-col items-center">
              <div
                onClick={() => setFlipped(!flipped)}
                className="
                  w-full max-w-md
                  h-[300px]
                  cursor-pointer
                "
              >
                <div
                  className="
                    relative w-full h-full
                    transition-transform duration-500
                  "
                  style={{
                    transformStyle: "preserve-3d",

                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* FRONT */}
                  <div
                    className="
                    absolute inset-0
                    flex flex-col items-center justify-center gap-3
                    rounded-3xl
                    bg-[var(--card)]
                    border
                    p-4
                  "
                    style={{
                      borderColor: "var(--border)",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <div className="text-center">
                      <h1 className="text-3xl font-black">{current.Word}</h1>

                      {current.Pronunciation && (
                        <p className="text-sm opacity-60 mt-1">
                          ({current.Pronunciation})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BACK */}
                  <div
                    className="
                    absolute inset-0
                    flex items-center justify-center
                    rounded-3xl
                    text-white
                    p-6 text-center
                  "
                    style={{
                      background: "var(--primary)",
                      transform: "rotateY(180deg)",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <h1 className="text-3xl font-black">{current.Meaning}</h1>
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="w-full max-w-md mt-5 grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleSRS("again")}
                  className="bg-red-500 text-white py-3 rounded-xl font-semibold"
                >
                  Again
                </button>

                <button
                  onClick={() => handleSRS("hard")}
                  className="bg-orange-500 text-white py-3 rounded-xl font-semibold"
                >
                  Hard
                </button>

                <button
                  onClick={() => handleSRS("normal")}
                  className="bg-yellow-500 text-white py-3 rounded-xl font-semibold"
                >
                  Good
                </button>

                <button
                  onClick={() => handleSRS("easy")}
                  className="bg-green-500 text-white py-3 rounded-xl font-semibold"
                >
                  Easy
                </button>
              </div>
              {/* EXAMPLE CARD */}
              {isLearning && current?.ExampleSentence && (
                <div
                  className="
                  w-full max-w-md mt-4
                  p-4 rounded-2xl border
                  bg-[var(--card)]
                  space-y-2
                "
                  style={{ borderColor: "var(--border)" }}
                >
                  <p className="text-xs opacity-60">Ví dụ</p>

                  <p className="text-base font-semibold">
                    {current.ExampleSentence}
                  </p>

                  <p className="text-sm opacity-70">{current.ExampleMeaning}</p>
                </div>
              )}
            </div>
            {/* STATS */}
            <div
              className="
                p-5 rounded-2xl border
                bg-[var(--card)]
                text-sm space-y-3
              "
              style={{
                borderColor: "var(--border)",
              }}
            >
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={progressData}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={75}
                  >
                    {progressData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>

                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    fontSize={20}
                    fill="var(--text)"
                  >
                    {progress}%
                  </text>
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-1 text-sm">
                <p className="text-xs opacity-60">Chủ đề</p>

                <p className="font-semibold text-base">{topicName}</p>

                <p className="text-xs opacity-60 mt-2">Cấp độ</p>

                <p className="font-medium">{levelText}</p>

                <div className="mt-3 space-y-1">
                  <p>
                    <span className="opacity-60">Đã học:</span>{" "}
                    <span className="font-semibold text-green-500">
                      {learned}
                    </span>
                  </p>

                  <p>
                    <span className="opacity-60">Còn lại:</span>{" "}
                    <span className="font-semibold text-orange-400">
                      {left}
                    </span>
                  </p>

                  <p>
                    <span className="opacity-60">Accuracy:</span>{" "}
                    <span className="font-semibold text-blue-500">
                      {accuracy}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
