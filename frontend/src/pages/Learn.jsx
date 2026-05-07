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

  const safeWords = useMemo(() => (Array.isArray(words) ? words : []), [words]);

  const current = safeWords[index] ?? null;
  const finished = safeWords.length > 0 && index >= safeWords.length;

  // ================= LOAD TOPICS =================
  useEffect(() => {
    api
      .get("/topics")
      .then((res) => setTopics(res.data || []))
      .catch(console.log);
  }, []);

  // ================= LOAD WORDS =================
  useEffect(() => {
    if (!selectedTopic) return;

    api
      .get("/vocabularies", {
        params: { topicId: selectedTopic },
      })
      .then((res) => {
        const data = res.data || [];

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
    if (!current || !flipped || !settings?.autoPlayAudio) return;

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
    if (!settings?.autoFlip || flipped || !current || finished) return;

    flipTimerRef.current = setTimeout(() => {
      setFlipped(true);
    }, settings?.autoFlipTime || 4000);

    return () => clearTimeout(flipTimerRef.current);
  }, [flipped, current?.Id, settings, finished]);

  // ================= ACTIONS =================
  const nextWord = () => setIndex((p) => p + 1);

  const handleSelectTopic = (id) => {
    // FIX: reset ngay tại click → bỏ useEffect anti-pattern
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
    } catch (e) {
      console.log(e);
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
    { name: "done", value: learned },
    { name: "left", value: left },
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
            style={{ background: "var(--primary)" }}
          >
            Chọn chủ đề khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5 bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* FILTER */}
        {!isLearning && (
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1 text-sm rounded-full border"
                style={{
                  background:
                    filter === f.key ? "var(--primary)" : "var(--card)",
                  color: filter === f.key ? "#fff" : "var(--text)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* TOPICS */}
        {!isLearning && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((t) => (
              <div
                key={t.Id}
                onClick={() => handleSelectTopic(t.Id)}
                className="p-3 rounded-xl border bg-[var(--card)] cursor-pointer"
              >
                <h3 className="font-semibold text-sm">{t.Name}</h3>
                <p className="text-xs opacity-70">Level {t.Level}</p>
              </div>
            ))}
          </div>
        )}

        {/* LEARNING */}
        {isLearning && current && (
          <div className="grid lg:grid-cols-3 gap-4">
            {/* CARD */}
            <div className="lg:col-span-2 flex flex-col items-center">
              <div
                onClick={() => setFlipped(!flipped)}
                className="w-full max-w-md h-[300px]"
              >
                <div
                  className="relative w-full h-full transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--card)]"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <h1 className="text-3xl font-bold">{current.Word}</h1>
                  </div>

                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-2xl text-white"
                    style={{
                      background: "var(--primary)",
                      transform: "rotateY(180deg)",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <h1 className="text-3xl font-bold">{current.Meaning}</h1>
                  </div>
                </div>
              </div>

              {/* SRS */}
              <div className="w-full max-w-md mt-4 grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleSRS("again")}
                  className="bg-red-500 text-white py-2 rounded-lg"
                >
                  Again
                </button>
                <button
                  onClick={() => handleSRS("hard")}
                  className="bg-orange-500 text-white py-2 rounded-lg"
                >
                  Hard
                </button>
                <button
                  onClick={() => handleSRS("normal")}
                  className="bg-yellow-500 text-white py-2 rounded-lg"
                >
                  Good
                </button>
                <button
                  onClick={() => handleSRS("easy")}
                  className="bg-green-500 text-white py-2 rounded-lg"
                >
                  Easy
                </button>
              </div>
            </div>

            {/* STATS */}
            <div className="p-4 rounded-xl bg-[var(--card)] border text-sm space-y-3">
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
                {/* TOPIC */}
                <p className="text-xs opacity-60">Chủ đề</p>
                <p className="font-semibold text-base">{topicName}</p>

                <p className="text-xs opacity-60 mt-2">Cấp độ</p>
                <p className="font-medium">{levelText}</p>

                {/* STATS */}
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
