import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function Learn() {
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

  // ================= LOAD TOPICS =================
  useEffect(() => {
    fetch("http://localhost:5000/api/topics")
      .then((r) => r.json())
      .then((data) => setTopics(Array.isArray(data) ? data : []))
      .catch(console.log);
  }, []);

  // ================= LOAD WORDS =================
  useEffect(() => {
    if (!selectedTopic) return;

    const load = async () => {
      const url = new URL("http://localhost:5000/api/vocabularies");
      url.searchParams.set("topicId", selectedTopic);

      const res = await fetch(url.toString());
      const data = await res.json();

      setWords(Array.isArray(data) ? data : []);
      setIndex(0);
      setFinished(false);
      setFlipped(false);
      setIsLearning(true);
    };

    load();
  }, [selectedTopic]);

  // ================= FILTER =================
  const filteredTopics = topics.filter((t) => {
    if (filter === "all") return true;
    if (filter === "topik1") return t.Level <= 2;
    if (filter === "topik2") return t.Level >= 3;
    if (filter === "beginner") return t.Level === 1;
    if (filter === "intermediate") return t.Level === 2;
    if (filter === "advanced") return t.Level >= 3;
    return true;
  });

  const current = words[index] ?? null;

  // ================= NEXT WORD =================
  const nextWord = () => {
    setFlipped(false);

    setTimeout(() => {
      setIndex((prev) => {
        if (prev >= words.length - 1) {
          setFinished(true);
          return prev;
        }
        return prev + 1;
      });
    }, 200);
  };

  const handleBack = () => {
    setIsLearning(false);
    setSelectedTopic(null);
    setWords([]);
    setIndex(0);
    setFinished(false);
    setFlipped(false);
  };

  // ================= SRS =================
  const handleSRS = async (level) => {
    if (!current?.Id) return;

    let intervalDays = 3;
    if (level === "hard") intervalDays = 1;
    if (level === "easy") intervalDays = 7;

    await fetch("http://localhost:5000/api/vocabularies/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: current.Id,
        level,
        intervalDays,
      }),
    });

    nextWord();
  };

  // ================= PROGRESS =================
  const total = words.length;
  const learned = index;
  const left = total - learned;
  const progress = total ? Math.round((learned / total) * 100) : 0;

  const progressData = [
    { name: "done", value: learned },
    { name: "left", value: left },
  ];

  const COLORS = ["#7c3aed", "#e5e7eb"];

  const topicName = topics.find((t) => t.Id === selectedTopic)?.Name || "—";

  const topicLevel = topics.find((t) => t.Id === selectedTopic)?.Level;

  const levelText = !topicLevel
    ? "—"
    : topicLevel <= 2
      ? "Sơ cấp (TOPIK I)"
      : "Trung cấp (TOPIK II)";

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 p-6">
      {/* HEADER */}
      <div className="bg-white/70 backdrop-blur-xl border rounded-3xl p-6 shadow">
        <h1 className="text-3xl font-bold">📖 TOPIK SRS Learning</h1>
      </div>

      {/* FILTER */}
      {!isLearning && (
        <div className="flex gap-2 flex-wrap mt-6">
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
              className={`px-4 py-2 rounded-full border ${
                filter === f
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* TOPICS */}
      {!isLearning && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          {filteredTopics.map((t) => (
            <div
              key={t.Id}
              onClick={() => setSelectedTopic(t.Id)}
              className="bg-white p-4 rounded-2xl shadow cursor-pointer hover:scale-[1.02] transition"
            >
              <img
                src={`/images/${topicImage[t.Id] || "default.png"}`}
                className="h-28 w-full object-cover rounded-xl"
              />
              <h3 className="font-bold mt-2">{t.Name}</h3>
              <p className="text-sm text-gray-500">
                {t.WordCount} từ • Level {t.Level}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* LEARN */}
      {isLearning && !finished && current && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* CARD FLIP 3D */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <div
              onClick={() => setFlipped((p) => !p)}
              className="w-[430px] h-[360px] perspective cursor-pointer"
            >
              <div
                className={`relative w-full h-full duration-700 transform-style ${
                  flipped ? "rotate-y-180" : ""
                }`}
              >
                {/* FRONT */}
                <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow flex flex-col items-center justify-center">
                  <h1 className="text-4xl font-bold">{current.Word}</h1>
                  <p className="text-gray-400 mt-2">{current.Pronunciation}</p>
                  <p className="text-xs mt-4 text-gray-300">Click để lật</p>
                </div>

                {/* BACK */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-purple-600 text-white rounded-3xl shadow flex items-center justify-center">
                  <h1 className="text-4xl font-bold">{current.Meaning}</h1>
                </div>
              </div>
            </div>

            {/* ACTION BAR */}
            <div className="w-[430px] mt-6 bg-white shadow-lg rounded-2xl p-3 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => handleSRS("hard")}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl active:scale-95 transition"
                >
                  Khó (1d)
                </button>

                <button
                  onClick={() => handleSRS("normal")}
                  className="flex-1 py-2 bg-yellow-500 text-white rounded-xl active:scale-95 transition"
                >
                  Bình thường (3d)
                </button>

                <button
                  onClick={() => handleSRS("easy")}
                  className="flex-1 py-2 bg-green-500 text-white rounded-xl active:scale-95 transition"
                >
                  Dễ (7d)
                </button>
              </div>

              <button
                onClick={nextWord}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold active:scale-95 transition"
              >
                Tiếp theo
              </button>
            </div>
          </div>

          {/* PROGRESS */}
          <div className="bg-white p-5 rounded-2xl shadow">
            <button onClick={handleBack} className="text-purple-600">
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
              </PieChart>
            </ResponsiveContainer>

            <p>Đã học: {learned}</p>
            <p>Còn lại: {left}</p>
            <p className="text-purple-600 font-bold">{progress}%</p>

            <div className="border-t mt-3 pt-3 text-sm space-y-2">
              <div>
                <p className="text-gray-500">Chủ đề</p>
                <p className="font-bold">{topicName}</p>
              </div>

              <div>
                <p className="text-gray-500">Trình độ</p>
                <p className="font-bold">{levelText}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLIP CSS */}
      <style>{`
        .perspective { perspective: 1000px; }
        .transform-style { transform-style: preserve-3d; }
        .backface-hidden {
          backface-visibility: hidden;
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* FINISHED SCREEN */}
      {finished && (
        <div className="text-center mt-10 bg-white p-8 rounded-2xl shadow">
          <h1 className="text-3xl font-bold text-green-600">🎉 Hoàn thành!</h1>

          <p className="text-gray-500 mt-2">
            Bạn đã học xong {words.length} từ vựng
          </p>

          <button
            onClick={handleBack}
            className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-xl active:scale-95 transition"
          >
            Học lại
          </button>
        </div>
      )}
    </div>
  );
}
