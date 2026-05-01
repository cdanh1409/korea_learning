import { useEffect, useState, useMemo } from "react";
import Card from "../components/common/Card";
import api from "../utils/api";

// ================= SHUFFLE =================
const shuffleArray = (arr = []) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function Review() {
  const [topics, setTopics] = useState([]);
  const [words, setWords] = useState([]);

  const [todayCount, setTodayCount] = useState(0);
  const [memoryRate, setMemoryRate] = useState(0);
  const [streak, setStreak] = useState(0);

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loadingWords, setLoadingWords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const currentWord = words?.[currentIndex] || null;

  const hasWords = Array.isArray(words) && words.length > 0;

  const isDone =
    selectedTopic &&
    Array.isArray(words) &&
    words.length > 0 &&
    currentIndex >= words.length;

  const isLearning = selectedTopic && hasWords && !isDone;

  // ================= LOAD INIT =================
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const [topicsRes, todayRes, statsRes, streakRes] = await Promise.all([
          api.get("/topics"),
          api.get("/review/today"),
          api.get("/review/stats"),
          api.get("/review/streak"),
        ]);

        if (ignore) return;

        setTopics(topicsRes.data || []);
        setTodayCount(todayRes.data?.length || 0);
        setMemoryRate(statsRes.data?.rate || 0);
        setStreak(streakRes.data?.streak || 0);
      } catch (err) {
        console.error("LOAD ERROR:", err);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  // ================= CHOICES =================
  const choices = useMemo(() => {
    if (!currentWord || !Array.isArray(words)) return [];

    const sameTopic = words.filter((w) => w.TopicId === currentWord.TopicId);
    const pool = sameTopic.filter((w) => w.Id !== currentWord.Id);
    const fake = shuffleArray(pool).slice(0, 3);

    return shuffleArray([...fake, currentWord]);
  }, [currentWord, words]);

  // ================= SELECT TOPIC =================
  const handleSelectTopic = async (topic) => {
    setNotice(null);
    setSelectedTopic(topic);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setLoadingWords(true);
    setWords([]);

    try {
      const res = await api.get(`/review?topicId=${topic.Id}`);

      if (!Array.isArray(res.data) || res.data.length === 0) {
        setNotice("Chủ đề chưa có từ để học");
        setSelectedTopic(null);
        setLoadingWords(false);
        return;
      }

      setWords(shuffleArray(res.data));
    } catch (err) {
      console.error(err);
    }

    setLoadingWords(false);
  };

  // ================= ANSWER =================
  const handleAnswer = async (level) => {
    if (!currentWord || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await api.post("/review", {
        id: currentWord.Id,
        level,
      });

      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } catch (err) {
      console.error(err);
    }

    setIsSubmitting(false);
  };

  const handleSelectAnswer = (choice) => {
    if (selectedAnswer || isSubmitting) return;

    setSelectedAnswer(choice.Id);

    setTimeout(() => {
      handleAnswer(choice.Id === currentWord.Id ? "easy" : "again");
    }, 200);
  };

  const resetTopic = () => {
    setSelectedTopic(null);
    setWords([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setNotice(null);
  };

  const progress = hasWords
    ? Math.round((currentIndex / words.length) * 100)
    : 0;

  const displayToday =
    todayCount === 0 && selectedTopic ? words.length : todayCount;

  const rateColor =
    memoryRate >= 80
      ? "text-green-500"
      : memoryRate >= 60
        ? "text-yellow-500"
        : "text-red-500";

  const streakColor =
    streak >= 7
      ? "text-red-500"
      : streak >= 3
        ? "text-orange-500"
        : "text-gray-400";

  return (
    <div className="p-6 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold">Ôn tập</h1>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        <Card>Hôm nay: {displayToday}</Card>
        <Card className={rateColor}>Rate: {memoryRate}%</Card>
        <Card className={streakColor}>🔥 {streak}</Card>
      </div>

      {/* TOPIC */}
      {!isLearning && (
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t.Id}
              onClick={() => handleSelectTopic(t)}
              className="px-3 py-2 border rounded"
            >
              {t.Name}
            </button>
          ))}
        </div>
      )}

      {/* NOTICE */}
      {notice && <Card>{notice}</Card>}

      {/* LOADING */}
      {loadingWords && <Card>Loading...</Card>}

      {/* DONE */}
      {isDone && (
        <Card>
          Done!
          <button onClick={resetTopic}>Reset</button>
        </Card>
      )}

      {/* WORD */}
      {currentWord && !isDone && (
        <div>
          <Card>
            {currentIndex + 1} / {words.length} ({progress}%)
          </Card>

          <Card>
            <h2>{currentWord.Word}</h2>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            {choices.map((c) => {
              const correct = c.Id === currentWord.Id;
              const selected = selectedAnswer === c.Id;

              return (
                <button
                  key={c.Id}
                  onClick={() => handleSelectAnswer(c)}
                  className={`border p-2 rounded ${
                    selectedAnswer
                      ? correct
                        ? "bg-green-500 text-white"
                        : selected
                          ? "bg-red-500 text-white"
                          : ""
                      : ""
                  }`}
                >
                  {c.Meaning}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => handleAnswer("again")}>Again</button>
            <button onClick={() => handleAnswer("hard")}>Hard</button>
            <button onClick={() => handleAnswer("easy")}>Easy</button>
          </div>
        </div>
      )}
    </div>
  );
}
