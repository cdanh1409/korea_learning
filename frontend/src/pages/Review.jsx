import { useEffect, useState, useMemo } from "react";
import Card from "../components/common/Card";

export default function Review() {
  const [topics, setTopics] = useState([]);
  const [words, setWords] = useState([]);

  const [todayCount, setTodayCount] = useState(0);
  const [memoryRate, setMemoryRate] = useState(0);
  const [streak, setStreak] = useState(0);

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const currentWord = words[currentIndex];
  const isDone = currentIndex >= words.length;

  // ================= LOAD =================
  useEffect(() => {
    fetch("http://localhost:5000/api/topics")
      .then((res) => res.json())
      .then(setTopics);

    fetch("http://localhost:5000/api/review/today")
      .then((res) => res.json())
      .then((data) => setTodayCount(data.length));

    fetch("http://localhost:5000/api/review/stats")
      .then((res) => res.json())
      .then((data) => setMemoryRate(data.rate || 0));

    fetch("http://localhost:5000/api/review/streak")
      .then((res) => res.json())
      .then((data) => setStreak(data.streak || 0));
  }, []);

  // ================= QUIZ =================
  const choices = useMemo(() => {
    if (!currentWord || words.length === 0) return [];

    const pool = words.filter((w) => w.Id !== currentWord.Id);
    const fake = pool.slice(0, 3);

    return [...fake, currentWord].sort((a, b) => a.Id - b.Id);
  }, [currentWord, words]);

  // ================= TOPIC =================
  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setCurrentIndex(0);
    setSelectedAnswer(null);

    fetch(`http://localhost:5000/api/review?topicId=${topic.Id}`)
      .then((res) => res.json())
      .then(setWords);
  };

  const nextWord = () => {
    setSelectedAnswer(null);
    setCurrentIndex((p) => p + 1);
  };

  const handleAnswer = async (type) => {
    if (!currentWord) return;

    await fetch(`http://localhost:5000/api/review/${currentWord.Id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });

    nextWord();
  };

  const handleSelectAnswer = (choice) => {
    if (selectedAnswer) return;

    setSelectedAnswer(choice.Id);

    setTimeout(() => {
      handleAnswer(choice.Id === currentWord.Id ? "good" : "again");
    }, 400);
  };

  const progress = words.length
    ? Math.round(((currentIndex + 1) / words.length) * 100)
    : 0;

  const rateColor =
    memoryRate >= 80
      ? "text-[var(--primary)]"
      : memoryRate >= 60
        ? "text-yellow-500"
        : "text-red-500";

  const streakColor =
    streak >= 7
      ? "text-red-500"
      : streak >= 3
        ? "text-orange-500"
        : "text-[var(--muted)]";

  return (
    <div
      className="p-6 min-h-screen space-y-6"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-3xl font-bold">🔁 Ôn tập</h1>
        <p style={{ color: "var(--muted)" }}>Lặp lại để ghi nhớ lâu hơn</p>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p style={{ color: "var(--muted)" }}>Hôm nay</p>
          <h2 className="text-2xl font-bold">{todayCount}</h2>
        </Card>

        <Card>
          <p style={{ color: "var(--muted)" }}>Tỉ lệ ghi nhớ</p>
          <h2 className={`text-2xl font-bold ${rateColor}`}>{memoryRate}%</h2>
        </Card>

        <Card>
          <p style={{ color: "var(--muted)" }}>Chuỗi</p>
          <h2 className={`text-2xl font-bold ${streakColor}`}>🔥 {streak}</h2>
        </Card>
      </div>

      {/* ================= TOPICS ================= */}
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t.Id}
            onClick={() => handleSelectTopic(t)}
            className="px-4 py-2 rounded-xl border transition"
            style={{
              background:
                selectedTopic?.Id === t.Id ? "var(--primary)" : "var(--card)",
              color: selectedTopic?.Id === t.Id ? "#fff" : "var(--text)",
              borderColor: "var(--border)",
            }}
          >
            {t.Name} ({t.WordCount})
          </button>
        ))}
      </div>

      {/* ================= DONE ================= */}
      {selectedTopic && isDone && (
        <Card>
          <h2 className="text-xl font-bold">
            🎉 Hoàn thành {selectedTopic.Name}
          </h2>

          <button
            onClick={() => {
              setSelectedTopic(null);
              setWords([]);
              setCurrentIndex(0);
            }}
            className="mt-4 px-4 py-2 rounded-xl text-white"
            style={{ background: "var(--primary)" }}
          >
            Chọn chủ đề khác
          </button>
        </Card>
      )}

      {/* ================= MAIN ================= */}
      {currentWord && !isDone && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-4">
            {/* PROGRESS */}
            <Card>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {currentIndex + 1}/{words.length}
                </span>
                <span>{progress}%</span>
              </div>

              <div
                className="h-2 rounded-full"
                style={{ background: "var(--card2)" }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: "var(--primary)",
                  }}
                />
              </div>
            </Card>

            {/* WORD CARD */}
            <Card className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">{currentWord.Word}</h2>
                <p style={{ color: "var(--muted)" }}>
                  {currentWord.Pronunciation}
                </p>
              </div>

              <div className="w-28 h-28 rounded-xl overflow-hidden bg-[var(--card2)] flex items-center justify-center">
                {currentWord.Image ? (
                  <img
                    src={`http://localhost:5000${currentWord.Image}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span style={{ color: "var(--muted)" }}>IMG</span>
                )}
              </div>
            </Card>

            {/* QUIZ */}
            <div className="grid grid-cols-2 gap-3">
              {choices.map((c, i) => {
                const isCorrect = c.Id === currentWord.Id;
                const isSelected = selectedAnswer === c.Id;

                let style = {
                  background: "var(--card)",
                  borderColor: "var(--border)",
                };

                if (selectedAnswer) {
                  if (isCorrect) style.background = "#22c55e";
                  else if (isSelected) style.background = "#ef4444";
                }

                return (
                  <button
                    key={c.Id}
                    onClick={() => handleSelectAnswer(c)}
                    disabled={selectedAnswer !== null}
                    className="p-4 rounded-xl border text-left transition"
                    style={style}
                  >
                    <b>{i + 1}.</b> {c.Meaning}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-3">
            <Card>
              <button onClick={() => handleAnswer("skip")}>⏭ Bỏ qua</button>
            </Card>

            <Card>
              <button onClick={() => handleAnswer("again")}>❌ Chưa nhớ</button>
            </Card>

            <Card>
              <button onClick={() => handleAnswer("good")}>✅ Đã nhớ</button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
