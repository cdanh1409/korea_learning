import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import useSettings from "../hooks/useSettings";

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

  const topicImage = {
    1: "family.png",
    2: "school.png",
    3: "food.png",
    4: "greeting.png",
    5: "job.png",
    6: "travel.png",
  };

  const safeWords = useMemo(() => (Array.isArray(words) ? words : []), [words]);
  const current = safeWords[index] ?? null;
  const hasStarted = selectedTopic && safeWords.length > 0;

  // ================= FETCH =================
  useEffect(() => {
    fetch("http://localhost:5000/api/topics")
      .then((r) => r.json())
      .then((data) => setTopics(Array.isArray(data) ? data : []))
      .catch(console.log);
  }, []);

  useEffect(() => {
    if (!selectedTopic) return;

    const loadWords = async () => {
      const url = new URL("http://localhost:5000/api/vocabularies");
      url.searchParams.set("topicId", selectedTopic);

      const res = await fetch(url);
      const data = await res.json();

      setWords(Array.isArray(data) ? data : []);
      setIndex(0);
      setFinished(false);
      setFlipped(false);
      setIsLearning(true);
    };

    loadWords();
  }, [selectedTopic]);

  // ================= AUTO AUDIO =================
  useEffect(() => {
    if (!current) return;
    if (!flipped) return;
    if (!settings?.autoPlayAudio) return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(current.Word);
    utter.lang = "ko-KR";

    const timer = setTimeout(() => synth.speak(utter), 80);
    return () => clearTimeout(timer);
  }, [flipped, current?.Id, settings?.autoPlayAudio]);

  const filteredTopics = topics.filter((t) => {
    if (filter === "all") return true;
    if (filter === "topik1") return t.Level <= 2;
    if (filter === "topik2") return t.Level >= 3;
    if (filter === "beginner") return t.Level === 1;
    if (filter === "intermediate") return t.Level === 2;
    if (filter === "advanced") return t.Level >= 3;
    return true;
  });

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
    }, 150);
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

  const handleSRS = async (grade) => {
    if (!current?.Id) return;

    await fetch("http://localhost:5000/api/vocabularies/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: current.Id, grade }),
    });

    nextWord();
  };

  const total = safeWords.length;
  const learned = hasStarted ? index : 0;
  const left = Math.max(total - learned, 0);
  const progress = total ? Math.round((learned / total) * 100) : 0;

  const progressData = [
    { name: "done", value: learned },
    { name: "left", value: left },
  ];

  const COLORS = ["var(--primary)", "var(--card2)"];

  const topicName = topics.find((t) => t.Id === selectedTopic)?.Name || "—";

  const topicLevel = topics.find((t) => t.Id === selectedTopic)?.Level;

  const levelText = !topicLevel
    ? "—"
    : topicLevel <= 2
      ? "Sơ cấp (TOPIK I)"
      : "Trung cấp (TOPIK II)";

  // ================= UI =================
  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <h1 className="text-3xl font-bold">📖 Learning FlashCard</h1>
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
                  color: filter === f ? "white" : "var(--text)",
                  borderColor: "var(--border)",
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
                className="rounded-2xl shadow cursor-pointer overflow-hidden transition hover:scale-[1.02]"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <img
                  src={`/images/${topicImage[t.Id] || "default.png"}`}
                  className="h-40 w-full object-cover"
                />

                <div className="p-4">
                  <h3 className="font-bold text-lg">{t.Name}</h3>
                  <p className="text-sm opacity-70">
                    {t.WordCount} từ • Level {t.Level}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEARN */}
        {isLearning && !finished && current && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* FLASHCARD */}
            <div className="lg:col-span-2 flex flex-col items-center">
              <div
                onClick={() => setFlipped((p) => !p)}
                className="w-full max-w-md h-[380px] cursor-pointer"
              >
                <div
                  className={`relative w-full h-full transition-transform duration-700 ${
                    flipped ? "rotate-y-180" : ""
                  }`}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* FRONT */}
                  <div
                    className="absolute inset-0 flex items-center justify-center p-6 rounded-3xl"
                    style={{
                      background: "var(--card)",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    {settings?.showImageFirst ? (
                      <img
                        src={`/images/${current.Image || "default.png"}`}
                        className="h-40"
                      />
                    ) : (
                      <div className="text-center">
                        <h1 className="text-4xl font-bold">{current.Word}</h1>
                        <p className="mt-2 opacity-60">
                          {current.Pronunciation}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* BACK */}
                  <div
                    className="absolute inset-0 flex items-center justify-center p-6 rounded-3xl text-white"
                    style={{
                      background: "var(--primary)",
                      transform: "rotateY(180deg)",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <h1 className="text-4xl font-bold text-center">
                      {current.Meaning}
                    </h1>
                  </div>
                </div>
              </div>

              {/* ACTION */}
              <div
                className="w-full max-w-md mt-6 rounded-2xl shadow p-4 space-y-3"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSRS("again")}
                    className="py-2 rounded-xl text-white"
                    style={{ background: "#ef4444" }}
                  >
                    Sai
                  </button>

                  <button
                    onClick={() => handleSRS("hard")}
                    className="py-2 rounded-xl text-white"
                    style={{ background: "#f59e0b" }}
                  >
                    Khó
                  </button>

                  <button
                    onClick={() => handleSRS("easy")}
                    className="py-2 rounded-xl text-white"
                    style={{ background: "#22c55e" }}
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
            <div
              className="rounded-2xl shadow p-5 space-y-4"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <button onClick={handleBack} style={{ color: "var(--primary)" }}>
                ← Quay lại
              </button>

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
                    dominantBaseline="middle"
                    fill="var(--primary)"
                    fontSize="22"
                    fontWeight="bold"
                  >
                    {progress}%
                  </text>
                </PieChart>
              </ResponsiveContainer>

              <p>Đã học: {learned}</p>
              <p>Còn lại: {left}</p>

              <div
                className="border-t pt-3 text-sm"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="font-semibold">{topicName}</p>
                <p>{levelText}</p>
              </div>
            </div>
          </div>
        )}

        {/* FINISH */}
        {isLearning && finished && (
          <div
            className="mt-10 rounded-2xl shadow p-10 text-center"
            style={{ background: "var(--card)" }}
          >
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--primary)" }}
            >
              🎉 Hoàn thành bài học!
            </h1>

            <p className="mt-2 opacity-70">
              Bạn đã học xong {words.length} từ vựng
            </p>

            <button
              onClick={handleBack}
              className="mt-6 px-6 py-3 rounded-xl text-white"
              style={{ background: "var(--primary)" }}
            >
              Học lại / Chọn bài khác
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
