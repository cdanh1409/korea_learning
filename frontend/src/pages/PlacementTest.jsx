import { useMemo, useState, useCallback } from "react";
import Card from "../components/common/Card";
import api from "../utils/api";

export default function PlacementTest() {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [unansweredIds, setUnansweredIds] = useState([]);

  // =========================
  // SAFE UNWRAP API (QUAN TRỌNG NHẤT)
  // =========================
  const unwrap = (res) => res?.data?.data ?? res?.data ?? res ?? [];

  // =========================
  // HELPERS
  // =========================
  const getQuestionId = useCallback((q) => q.Id ?? q.id, []);

  // =========================
  // PROGRESS
  // =========================
  const answeredCount = useMemo(() => {
    return Object.values(answers).filter(Boolean).length;
  }, [answers]);

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round((answeredCount / questions.length) * 100);
  }, [answeredCount, questions.length]);

  // =========================
  // START TEST
  // =========================
  const startTest = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/placement-test/questions");

      const data = unwrap(res);

      console.log("QUESTIONS DEBUG:", data);

      setQuestions(Array.isArray(data) ? data : []);

      setAnswers({});
      setResult(null);
      setUnansweredIds([]);
      setStarted(true);
    } catch (err) {
      console.log(err);
      setError("Không tải được đề kiểm tra");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ANSWER CHANGE
  // =========================
  const handleAnswer = (qId, opt) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: opt,
    }));

    setUnansweredIds((prev) => prev.filter((id) => id !== qId));
  };

  // =========================
  // RANDOM FILL
  // =========================
  const randomFillAnswers = () => {
    const options = ["A", "B", "C", "D"];

    setAnswers((prev) => {
      const next = { ...prev };

      questions.forEach((q) => {
        const id = getQuestionId(q);
        next[id] = options[Math.floor(Math.random() * options.length)];
      });

      return next;
    });
  };

  // =========================
  // SUBMIT
  // =========================
  const submitTest = async () => {
    try {
      setSubmitting(true);
      setError("");

      const unIds = questions
        .filter((q) => !answers[getQuestionId(q)])
        .map((q) => getQuestionId(q));

      if (unIds.length > 0) {
        setUnansweredIds(unIds);
        setError(`Bạn còn ${unIds.length} câu chưa trả lời`);
        return;
      }

      const safeAnswers = {};
      questions.forEach((q) => {
        const id = getQuestionId(q);
        safeAnswers[id] = String(answers[id]).trim().toUpperCase();
      });

      const res = await api.post("/placement-test/submit", {
        answers: safeAnswers,
      });

      setResult(unwrap(res));

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.log(err);
      setError("Nộp bài thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // RESTART
  // =========================
  const restart = () => {
    setStarted(false);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setError("");
    setUnansweredIds([]);
  };

  // =========================
  // STATUS COLOR
  // =========================
  const getStatusColor = (status) => {
    switch (status) {
      case "STRONG":
        return "text-green-400";
      case "AVERAGE":
        return "text-yellow-400";
      case "WEAK":
        return "text-red-400";
      default:
        return "";
    }
  };

  // =========================
  // START SCREEN
  // =========================
  if (!started) {
    return (
      <div className="p-6">
        <Card className="max-w-3xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-4">🎯 Placement Test</h1>

          <p className="opacity-70 mb-6">Kiểm tra trình độ từ vựng tiếng Hàn</p>

          {error && <div className="text-red-400 mb-3">{error}</div>}

          <button
            onClick={startTest}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl"
          >
            {loading ? "Loading..." : "Bắt đầu"}
          </button>
        </Card>
      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="p-6">
        {/* HEADER */}
        <div className="flex justify-between mb-4">
          <h1 className="text-xl font-bold">🎯 Placement Test</h1>

          {!result && (
            <span>
              {answeredCount}/{questions.length}
            </span>
          )}
        </div>

        {/* PROGRESS */}
        {!result && (
          <div className="mb-5">
            <div className="h-2 bg-gray-700 rounded">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && <div className="text-red-400 mb-4">{error}</div>}

        {/* QUESTIONS */}
        {!result &&
          questions.map((q, i) => {
            const id = getQuestionId(q);
            const isMissing = unansweredIds.includes(id);

            return (
              <Card
                key={id}
                className={`mb-4 p-4 ${
                  isMissing ? "border border-red-500" : ""
                }`}
              >
                <p className="font-semibold mb-3">
                  {i + 1}. {q.Question}
                </p>

                {["A", "B", "C", "D"].map((opt) => (
                  <label
                    key={opt}
                    className="flex gap-2 items-center mb-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`q-${id}`}
                      checked={answers[id] === opt}
                      onChange={() => handleAnswer(id, opt)}
                    />
                    <span>{q[`Option${opt}`]}</span>
                  </label>
                ))}
              </Card>
            );
          })}

        {/* ACTIONS */}
        {!result && (
          <div className="flex gap-3">
            <button
              onClick={randomFillAnswers}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              Random
            </button>

            <button
              onClick={submitTest}
              disabled={submitting}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              {submitting ? "Đang chấm..." : "Nộp bài"}
            </button>
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="font-bold mb-2">🎉 Kết quả</h2>

              <p>
                Điểm: <b>{result.score}/100</b>
              </p>

              <p>
                Đúng:{" "}
                <b>
                  {result.correct}/{result.total}
                </b>
              </p>

              <p className="text-blue-400 font-bold">{result.levelText}</p>
            </Card>

            <Card className="p-5">
              <h2 className="font-bold mb-3">📊 Phân tích</h2>

              {result.skillAnalysis?.map((s) => (
                <div key={s.skill} className="flex justify-between">
                  <span>{s.skill}</span>
                  <span className={getStatusColor(s.status)}>
                    {s.score}% ({s.status})
                  </span>
                </div>
              ))}
            </Card>

            {result.roadmap?.sections?.length > 0 && (
              <Card className="p-5">
                <h2 className="font-bold mb-3">📚 Lộ trình học</h2>

                {result.roadmap.sections.map((sec, i) => (
                  <div key={i} className="mb-3">
                    <p className="font-semibold text-blue-400">{sec.title}</p>

                    <ul className="list-disc pl-5">
                      {sec.items?.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </Card>
            )}

            <button
              onClick={restart}
              className="px-5 py-2 bg-gray-700 text-white rounded"
            >
              Làm lại
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
