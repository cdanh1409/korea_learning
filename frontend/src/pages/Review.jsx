import { useEffect, useState, useMemo } from "react";

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
  const loadStats = () => {
    fetch("http://localhost:5000/api/review/stats")
      .then((res) => res.json())
      .then((data) => setMemoryRate(data.rate || 0));

    fetch("http://localhost:5000/api/review/streak")
      .then((res) => res.json())
      .then((data) => setStreak(data.streak || 0));
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/topics")
      .then((res) => res.json())
      .then(setTopics);

    fetch("http://localhost:5000/api/review/today")
      .then((res) => res.json())
      .then((data) => setTodayCount(data.length));

    loadStats();
  }, []);

  // ================= QUIZ (NO RANDOM BUG) =================
  const choices = useMemo(() => {
    if (!currentWord || words.length === 0) return [];

    const pool = words.filter((w) => w.Id !== currentWord.Id);

    const fake = pool.slice(0, 3); // deterministic (no random)

    return [...fake, currentWord].sort((a, b) => a.Id - b.Id);
  }, [currentWord, words]);

  // ================= SELECT TOPIC =================
  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setCurrentIndex(0);
    setSelectedAnswer(null);

    fetch(`http://localhost:5000/api/review?topicId=${topic.Id}`)
      .then((res) => res.json())
      .then((data) => setWords(data));
  };

  // ================= NEXT =================
  const nextWord = () => {
    setSelectedAnswer(null);
    setCurrentIndex((prev) => prev + 1);
  };

  // ================= SRS =================
  const handleAnswer = async (type) => {
    if (!currentWord) return;

    await fetch(`http://localhost:5000/api/review/${currentWord.Id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    });

    loadStats();
    nextWord();
  };

  // ================= QUIZ CLICK =================
  const handleSelectAnswer = (choice) => {
    if (selectedAnswer) return;

    setSelectedAnswer(choice.Id);

    setTimeout(() => {
      handleAnswer(choice.Id === currentWord.Id ? "good" : "again");
    }, 400);
  };

  // ================= UI HELPERS =================
  const progress = words.length
    ? Math.round(((currentIndex + 1) / words.length) * 100)
    : 0;

  let rateColor = "text-red-500";
  if (memoryRate >= 80) rateColor = "text-green-500";
  else if (memoryRate >= 60) rateColor = "text-yellow-500";

  let streakColor = "text-gray-400";
  if (streak >= 3) streakColor = "text-orange-500";
  if (streak >= 7) streakColor = "text-red-500";

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-indigo-100 min-h-screen">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-4">🔁 Ôn tập</h1>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow text-center">
          <p className="text-gray-500">Từ cần ôn hôm nay</p>
          <h2 className="text-2xl font-bold">{todayCount}</h2>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow text-center">
          <p className="text-gray-500">Tỉ lệ ghi nhớ</p>
          <h2 className={`text-2xl font-bold ${rateColor}`}>{memoryRate}%</h2>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow text-center">
          <p className="text-gray-500">Chuỗi ngày</p>
          <h2 className={`text-2xl font-bold ${streakColor}`}>{streak} 🔥</h2>
        </div>
      </div>

      {/* TOPICS */}
      <div className="flex gap-3 flex-wrap mb-6">
        {topics.map((t) => (
          <div
            key={t.Id}
            onClick={() => handleSelectTopic(t)}
            className={`px-4 py-2 rounded-full cursor-pointer border transition ${
              selectedTopic?.Id === t.Id
                ? "bg-indigo-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {t.Name} ({t.WordCount})
          </div>
        ))}
      </div>

      {/* DONE */}
      {selectedTopic && isDone && (
        <div className="bg-white p-6 rounded-2xl shadow text-center">
          <h2 className="text-xl font-bold mb-2">
            🎉 Hoàn thành {selectedTopic.Name}
          </h2>

          <button
            onClick={() => {
              setSelectedTopic(null);
              setWords([]);
              setCurrentIndex(0);
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl"
          >
            Chọn chủ đề khác
          </button>
        </div>
      )}

      {/* MAIN */}
      {currentWord && !isDone && (
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="col-span-2 space-y-4">
            {/* PROGRESS */}
            <div className="bg-white p-3 rounded-xl shadow">
              <div className="flex justify-between text-sm mb-1">
                <span>
                  {currentIndex + 1}/{words.length}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="bg-indigo-500 h-2 rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* CARD */}
            <div className="bg-white p-6 rounded-2xl shadow flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">{currentWord.Word}</h2>
                <p className="text-gray-500">{currentWord.Pronunciation}</p>
              </div>

              <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {currentWord.Image ? (
                  <img
                    src={`http://localhost:5000${currentWord.Image}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-300">IMG</span>
                )}
              </div>
            </div>

            {/* QUIZ */}
            <div className="grid grid-cols-2 gap-3">
              {choices.map((c, i) => {
                const isCorrect = c.Id === currentWord.Id;
                const isSelected = selectedAnswer === c.Id;

                let style = "bg-white hover:bg-gray-50";

                if (selectedAnswer) {
                  if (isCorrect) style = "bg-green-200";
                  else if (isSelected) style = "bg-red-200";
                }

                return (
                  <button
                    key={c.Id}
                    onClick={() => handleSelectAnswer(c)}
                    disabled={selectedAnswer !== null}
                    className={`p-4 border rounded-xl text-left transition ${style}`}
                  >
                    <b>{i + 1}.</b> {c.Meaning}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleAnswer("skip")}
              className="p-3 bg-gray-200 rounded-xl"
            >
              ⏭ Bỏ qua
            </button>

            <button
              onClick={() => handleAnswer("again")}
              className="p-3 bg-red-500 text-white rounded-xl"
            >
              ❌ Chưa nhớ
            </button>

            <button
              onClick={() => handleAnswer("good")}
              className="p-3 bg-green-500 text-white rounded-xl"
            >
              ✅ Đã nhớ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
