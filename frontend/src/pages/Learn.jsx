import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import useSettings from "../hooks/useSettings";
import api from "../utils/api";

// ================= COLORS (THEME READY) =================
const COLORS = ["var(--primary)", "var(--warning)"];

export default function Learn() {
  const { settings } = useSettings();

  const [topics, setTopics] = useState([]);
  const [words, setWords] = useState([]);

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isLearning, setIsLearning] = useState(false);

  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [filter, setFilter] = useState("all");
  const [flipped, setFlipped] = useState(false);

  const safeWords = useMemo(() => (Array.isArray(words) ? words : []), [words]);
  const current = safeWords[index] || null;

  // ================= TOPICS =================
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/topics");
        setTopics(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.log(e);
      }
    };
    load();
  }, []);

  // ================= WORDS =================
  useEffect(() => {
    if (!selectedTopic) return;

    const load = async () => {
      try {
        const res = await api.get("/vocabularies", {
          params: { topicId: selectedTopic },
        });

        setWords(Array.isArray(res.data) ? res.data : []);
        setIndex(0);
        setFinished(false);
        setFlipped(false);
        setIsLearning(true);
      } catch (e) {
        console.log(e);
      }
    };

    load();
  }, [selectedTopic]);

  // ================= AUTO SPEAK =================
  useEffect(() => {
    if (!current || !flipped || !settings?.autoPlayAudio) return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(current.Word);
    utter.lang = "ko-KR";

    const t = setTimeout(() => synth.speak(utter), 100);
    return () => clearTimeout(t);
  }, [flipped, current?.Id]);

  // ================= FILTER =================
  const filteredTopics = topics.filter((t) => {
    const lv = Number(t?.Level || 0);

    if (filter === "all") return true;
    if (filter === "topik1") return lv <= 2;
    if (filter === "topik2") return lv >= 3;
    if (filter === "beginner") return lv <= 2;
    if (filter === "intermediate") return lv === 3 || lv === 4;
    if (filter === "advanced") return lv >= 5;

    return true;
  });

  // ================= NEXT =================
  const nextWord = () => {
    setFlipped(false);

    setTimeout(() => {
      setIndex((prev) => {
        const next = prev + 1;

        if (next >= safeWords.length) {
          setFinished(true);
          return prev;
        }

        return next;
      });
    }, 120);
  };

  const handleBack = () => {
    setIsLearning(false);
    setSelectedTopic(null);
    setWords([]);
    setIndex(0);
    setFinished(false);
    setFlipped(false);
    window.speechSynthesis.cancel();
  };

  // ================= SRS =================
  const handleSRS = async (level) => {
    if (!current?.Id) return;

    try {
      await api.post("/vocabularies/review", {
        id: current.Id,
        level,
      });

      nextWord();
    } catch (e) {
      console.log(e);
    }
  };

  // ================= UI CALC =================
  const total = safeWords.length;
  const learned = index;
  const left = Math.max(total - learned, 0);
  const progress = total ? Math.round((learned / total) * 100) : 0;

  const topicName = topics.find((t) => t.Id === selectedTopic)?.Name || "—";

  const topicLevel = topics.find((t) => t.Id === selectedTopic)?.Level;

  const levelText = !topicLevel
    ? "—"
    : topicLevel <= 2
      ? "TOPIK I (Sơ cấp)"
      : "TOPIK II (Trung cấp)";

  const progressData = [
    { name: "done", value: learned },
    { name: "left", value: left },
  ];

  // ================= UI =================
  return (
    <div className="min-h-screen p-6 bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="p-5 rounded-2xl border bg-[var(--card)]">
          <h1 className="text-3xl font-bold">📖 Learn Flashcard</h1>
        </div>

        {/* FILTER */}
        {!isLearning && (
          <div className="flex flex-wrap gap-2">
            {[
              "all",
              "topik1",
              "topik2",
              "beginner",
              "intermediate",
              "advanced",
            ].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-full border transition"
                style={{
                  background: filter === f ? "var(--primary)" : "var(--card)",
                  color: filter === f ? "#fff" : "var(--text)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* TOPICS */}
        {!isLearning && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTopics.map((t) => (
              <div
                key={t.Id}
                onClick={() => setSelectedTopic(t.Id)}
                className="rounded-2xl overflow-hidden cursor-pointer border bg-[var(--card)] hover:scale-[1.02] transition"
              >
                <div className="p-4">
                  <h3 className="font-bold">{t.Name}</h3>
                  <p className="text-sm opacity-70">Level {t.Level}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEARNING */}
        {isLearning && !finished && current && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* FLASHCARD */}
            <div className="lg:col-span-2 flex flex-col items-center">
              <div
                onClick={() => setFlipped(!flipped)}
                className="w-full max-w-md h-[380px] cursor-pointer"
              >
                <div
                  className="relative w-full h-full transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* FRONT */}
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-3xl bg-[var(--card)]"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="text-center">
                      <h1 className="text-4xl font-bold">{current.Word}</h1>
                      <p className="opacity-60">{current.Pronunciation}</p>
                    </div>
                  </div>

                  {/* BACK */}
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-3xl text-white"
                    style={{
                      background: "var(--primary)",
                      transform: "rotateY(180deg)",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <h1 className="text-4xl font-bold">{current.Meaning}</h1>
                  </div>
                </div>
              </div>

              {/* ACTION */}
              <div className="w-full max-w-md mt-6 p-4 rounded-2xl bg-[var(--card)] border space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSRS("again")}
                    className="bg-red-500 text-white py-2 rounded-xl"
                  >
                    Sai
                  </button>
                  <button
                    onClick={() => handleSRS("hard")}
                    className="bg-yellow-500 text-white py-2 rounded-xl"
                  >
                    Khó
                  </button>
                  <button
                    onClick={() => handleSRS("easy")}
                    className="bg-green-500 text-white py-2 rounded-xl"
                  >
                    Dễ
                  </button>
                </div>

                <button
                  onClick={nextWord}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ background: "var(--primary)" }}
                >
                  Tiếp theo
                </button>
              </div>
            </div>

            {/* PROGRESS */}
            <div className="p-5 rounded-2xl bg-[var(--card)] border">
              <button onClick={handleBack}>← Back</button>

              <ResponsiveContainer width="100%" height={180}>
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

              <p>Đã học: {learned}</p>
              <p>Còn lại: {left}</p>

              <div className="mt-3 pt-3 border-t text-sm">
                <p>{topicName}</p>
                <p>{levelText}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
