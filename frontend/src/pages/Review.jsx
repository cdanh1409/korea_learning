import { useEffect, useState, useMemo, useRef } from "react";
import Card from "../components/common/Card";
import api from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";

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
  const [resultImage, setResultImage] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  // "easy" | "again" | null

  const [stats, setStats] = useState({
    easy: 0,
    again: 0,
    skip: 0,
  });

  const [dashboard, setDashboard] = useState({
    due: 0,
    rate: 0,
    streak: 0,
  });

  const [emptyTopic, setEmptyTopic] = useState(false);
  const [forceLearnFirst, setForceLearnFirst] = useState(false);

  const timeoutRef = useRef(null);
  const lockRef = useRef(false);
  const [showResult, setShowResult] = useState(false);

  const currentWord = words[currentIndex];

  // ================= FINISHED (NO EFFECT - FIX ESLINT) =================
  const finished =
    selectedTopic && words.length > 0 && currentIndex >= words.length;

  // ================= LOAD DASHBOARD =================
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [topicsRes, statsRes, streakRes] = await Promise.all([
          api.get("/review/topics"),
          api.get("/review/stats"),
          api.get("/review/streak"),
        ]);

        const topicData = topicsRes.data || [];

        // ✅ CHECK SAU KHI CÓ DATA
        const hasNoVocabulary =
          topicData.length === 0 ||
          topicData.every((t) => (t.total || 0) === 0);

        if (hasNoVocabulary) {
          setForceLearnFirst(true);
          return;
        }

        setTopics(topicData);

        setDashboard({
          due: topicData.reduce((s, t) => s + (t.due || 0), 0),
          rate: statsRes.data?.rate || 0,
          streak: streakRes.data?.streak || 0,
        });
      } catch (err) {
        console.error(err);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // ================= CHOICES =================
  const choices = useMemo(() => {
    if (!currentWord) return [];
    const pool = words.filter((w) => w.Id !== currentWord.Id);
    return shuffleArray([...shuffleArray(pool).slice(0, 3), currentWord]);
  }, [currentWord, words]);

  // ================= SELECT TOPIC =================
  const handleSelectTopic = async (topic) => {
    clearTimeout(timeoutRef.current);
    lockRef.current = false;

    setSelectedTopic(topic);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswerResult(null);
    setStats({ easy: 0, again: 0, skip: 0 });
    setEmptyTopic(false);

    const res = await api.get(`/review?topicId=${topic.Id}`);

    // Nếu API trả về null/undefined → mới coi là lỗi
    if (!res.data) {
      setWords([]);
      setEmptyTopic(true);
      return;
    }

    // Nếu rỗng → KHÔNG coi là chưa học ngay
    if (res.data.length === 0) {
      console.warn("Không có từ để ôn, có thể do chưa tới lịch review");

      setWords([]);
      setEmptyTopic(true); // vẫn show UI cũ
      return;
    }

    setWords(shuffleArray(res.data));
  };

  // ================= ANSWER =================
  const handleAnswer = async (type) => {
    if (!currentWord || lockRef.current) return;

    lockRef.current = true;

    await api.post("/review", {
      id: currentWord.Id,
      level: type,
    });

    setStats((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));

    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((p) => p + 1);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setShowResult(false);
      setResultImage(null);
      lockRef.current = false;
    }, 900);
  };

  const handleSelectAnswer = (choice) => {
    if (selectedAnswer || !currentWord) return;

    const correct = choice.Id === currentWord.Id;

    setSelectedAnswer(choice.Id);
    setAnswerResult(correct ? "easy" : "again");

    setResultImage(
      correct
        ? "http://localhost:5000/images/correct.png"
        : "http://localhost:5000/images/wrong.png",
    );

    setShowResult(true);

    handleAnswer(correct ? "easy" : "again");
  };

  const handleSkip = () => {
    if (!currentWord || lockRef.current) return;

    setSelectedAnswer(null);
    setAnswerResult("again");

    setResultImage("http://localhost:5000/images/skip.png");
    setShowResult(true);

    handleAnswer("skip");
  };

  const resetReview = () => {
    clearTimeout(timeoutRef.current);
    lockRef.current = false;

    setSelectedTopic(null);
    setWords([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswerResult(null);
    setStats({ easy: 0, again: 0, skip: 0 });
    setEmptyTopic(false);
  };

  // ================= CALC =================
  const progress = words.length
    ? Math.round((currentIndex / words.length) * 100)
    : 0;

  const accuracy =
    stats.easy + stats.again > 0
      ? Math.round((stats.easy / (stats.easy + stats.again)) * 100)
      : 0;
  if (forceLearnFirst) {
    return (
      <div className="flex justify-center p-6">
        <Card className="p-10 text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">📚 Chưa có từ vựng</h2>

          <p className="text-[var(--muted)]">
            Bạn cần học từ vựng trước khi ôn tập
          </p>

          <button
            onClick={() => (window.location.href = "/learn")}
            className="px-6 py-3 rounded-xl text-white"
            style={{ background: "var(--primary)" }}
          >
            🚀 Đi học từ vựng
          </button>
        </Card>
      </div>
    );
  }
  if (forceLearnFirst) {
    return (
      <div className="flex justify-center p-6">
        <Card className="p-10 text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">📚 Chưa có từ vựng</h2>

          <p className="text-[var(--muted)]">
            Bạn cần học từ vựng trước khi ôn tập
          </p>

          <button
            onClick={() => (window.location.href = "/learn")}
            className="px-6 py-3 rounded-xl text-white"
            style={{ background: "var(--primary)" }}
          >
            🚀 Đi học từ vựng
          </button>
        </Card>
      </div>
    );
  }
  // ================= UI =================
  return (
    <div className="p-6 space-y-6 min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <h1 className="text-3xl font-bold">Ôn tập</h1>

      {/* ================= DASHBOARD ================= */}
      {selectedTopic && !finished && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-[var(--muted)]">Từ cần ôn hôm nay</p>
            <h2 className="text-3xl font-bold">{dashboard.due}</h2>
          </Card>

          <Card>
            <p className="text-sm text-[var(--muted)]">Tỉ lệ ghi nhớ</p>
            <h2 className="text-3xl font-bold">{dashboard.rate}%</h2>
          </Card>

          <Card>
            <p className="text-sm text-[var(--muted)]">Chuỗi ngày học</p>
            <h2 className="text-3xl font-bold">{dashboard.streak} 🔥</h2>
          </Card>
        </div>
      )}

      {/* ================= TOPICS ================= */}
      {!selectedTopic && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {topics.map((t) => {
            const percent = t.total ? Math.round((t.seen / t.total) * 100) : 0;

            const isNotLearned = !t.seen || t.seen === 0;
            const isCompleted = t.seen === t.total && t.total > 0;

            return (
              <motion.div
                key={t.Id}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  if (isNotLearned) {
                    window.location.href = "/learn";
                    return;
                  }
                  handleSelectTopic(t);
                }}
                className="cursor-pointer p-6 rounded-2xl shadow-md"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <h2
                  className="text-xl font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  {t.Name}
                </h2>

                <p className="text-sm text-[var(--muted)] mt-2">
                  {isNotLearned
                    ? "⚠ Chưa học - bắt đầu học"
                    : `Đã học: ${t.seen}/${t.total}`}
                </p>

                <p className="text-sm text-[var(--muted)]">
                  Đã nhớ: {t.mastered || 0}/{t.total}
                </p>

                {isCompleted && (
                  <span className="text-green-500 font-bold">
                    ✔ Đã hoàn thành
                  </span>
                )}

                <div className="mt-4 h-2 rounded-full bg-[var(--card2)]">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${percent}%`,
                      background: "var(--primary)",
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      {/* ================= EMPTY TOPIC (CHƯA HỌC) ================= */}
      {selectedTopic && emptyTopic && (
        <div className="flex justify-center">
          <Card className="p-10 text-center space-y-6 max-w-md w-full shadow-xl">
            <h2 className="text-3xl font-bold">📭 Chưa học chủ đề này</h2>

            <p className="text-[var(--muted)]">
              Bạn chưa học chủ đề <b>{selectedTopic.Name}</b>
            </p>

            <button
              onClick={resetReview}
              className="px-6 py-3 rounded-xl text-white"
              style={{ background: "var(--primary)" }}
            >
              ⬅ Quay lại chọn chủ đề
            </button>
          </Card>
        </div>
      )}
      {/* ================= MAIN ================= */}
      {currentWord && !finished && !emptyTopic && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="flex justify-between text-sm">
                <span>
                  {currentIndex}/{words.length}
                </span>
                <span>{progress}%</span>
              </div>

              <div className="h-2 mt-2 bg-[var(--card2)] rounded-full">
                <div
                  className="h-2 rounded-full bg-[var(--primary)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Card>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentWord.Id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
              >
                <Card className="p-6 flex justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">{currentWord.Word}</h2>
                    <p className="text-[var(--muted)]">
                      {currentWord.Pronunciation}
                    </p>
                  </div>

                  {currentWord.Image && (
                    <img
                      src={currentWord.Image}
                      className="w-28 h-28 rounded-xl object-cover"
                    />
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* ================= ANSWERS WITH EFFECT ================= */}
            <div className="grid grid-cols-2 gap-4">
              {choices.map((c, i) => {
                const isCorrect = c.Id === currentWord.Id;
                const isSelected = selectedAnswer === c.Id;

                let bg = "var(--card)";
                let color = "var(--text)";

                if (answerResult) {
                  if (isCorrect) {
                    bg = "var(--success)";
                    color = "#fff";
                  } else if (isSelected && answerResult === "again") {
                    bg = "var(--danger)";
                    color = "#fff";
                  }
                }

                return (
                  <motion.button
                    key={c.Id}
                    whileTap={{ scale: 0.95 }}
                    className="p-5 border rounded-2xl text-left transition-all"
                    onClick={() => handleSelectAnswer(c)}
                    style={{
                      borderColor: "var(--border)",
                      background: bg,
                      color,
                    }}
                  >
                    <b>{i + 1}.</b> {c.Meaning}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleSkip}
                className="px-8 py-3 rounded-full border"
                style={{
                  background: "var(--card2)",
                  borderColor: "var(--border)",
                }}
              >
                Skip
              </button>
            </div>
          </div>

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">{selectedTopic?.Name}</h2>
            <p>Đúng: {stats.easy}</p>
            <p>Sai: {stats.again}</p>
            <p>Bỏ qua: {stats.skip}</p>

            {/* ================= RESULT IMAGE ================= */}
            {showResult && resultImage && (
              <div className="mt-4">
                <img
                  src={resultImage}
                  className="
    w-full max-h-52
    object-contain
    rounded-2xl
    shadow-lg
    transition-all duration-300
    hover:scale-105
  "
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ================= FINISHED ================= */}
      {finished && (
        <div className="flex justify-center">
          <Card className="p-10 text-center space-y-6 max-w-xl w-full shadow-xl">
            <h2 className="text-4xl font-bold">Finished!</h2>

            <p>
              Độ chính xác:{" "}
              <span
                className="text-2xl font-bold"
                style={{ color: "var(--primary)" }}
              >
                {accuracy}%
              </span>
            </p>

            <div className="flex justify-around">
              <div>
                <p style={{ color: "var(--success)" }}>{stats.easy}</p>
                <p>Đúng</p>
              </div>

              <div>
                <p style={{ color: "var(--danger)" }}>{stats.again}</p>
                <p>Sai</p>
              </div>

              <div>
                <p style={{ color: "var(--muted)" }}>{stats.skip}</p>
                <p>Bỏ qua</p>
              </div>
            </div>

            <button
              onClick={resetReview}
              className="px-8 py-3 rounded-xl text-white"
              style={{ background: "var(--primary)" }}
            >
              🔁 Học lại
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
