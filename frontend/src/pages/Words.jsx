import { useEffect, useMemo, useState, useCallback } from "react";
import Card from "../components/common/Card";
import api from "../utils/api";

/* ================= NORMALIZE ================= */
const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

/* ================= CONSTANTS ================= */
const LEVELS = ["all", "Sơ cấp", "Trung cấp", "Cao cấp"];
const PAGE_SIZE = 10;

/* ================= PAGINATION ================= */
const getPagination = (page, totalPages) => {
  const pages = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (page > 3) pages.push("...");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (page < totalPages - 2) pages.push("...");

  pages.push(totalPages);

  return pages;
};

/* ================= FORMAT HELPERS ================= */
const formatEase = (ef) => {
  const v = Number(ef);

  if (v >= 2.6) return "Dễ";
  if (v >= 2.0) return "Trung bình";
  return "Khó";
};

const formatInterval = (days) => {
  const d = Number(days);

  if (!d || d <= 0) return "Ôn ngay";
  if (d === 1) return "Sau 1 ngày";
  return `Sau ${d} ngày`;
};

const toBool = (v) => v === true || v === 1 || v === "1";

export default function Words() {
  const [words, setWords] = useState([]);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [level, setLevel] = useState("all");

  const [page, setPage] = useState(1);
  const [selectedWord, setSelectedWord] = useState(null);

  /* ================= LOAD ================= */
  const loadWords = useCallback(async () => {
    try {
      const res = await api.get("/words");
      setWords(res.data || []);
    } catch (err) {
      console.error("LOAD WORDS ERROR:", err);
    }
  }, []);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  useEffect(() => {
    setPage(1);
  }, [search, topic, level]);

  /* ================= TOPICS ================= */
  const topics = useMemo(() => {
    return ["all", ...new Set(words.map((w) => w.TopicName).filter(Boolean))];
  }, [words]);

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    const s = search.toLowerCase();

    return words.filter((w) => {
      const okSearch =
        !s ||
        w.Word?.toLowerCase().includes(s) ||
        w.Meaning?.toLowerCase().includes(s);

      const okTopic = topic === "all" || w.TopicName === topic;

      const okLevel =
        level === "all" || normalize(w.LevelName) === normalize(level);

      return okSearch && okTopic && okLevel;
    });
  }, [words, search, topic, level]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pages = useMemo(
    () => getPagination(page, totalPages),
    [page, totalPages],
  );

  return (
    <div className="p-6 space-y-6 bg-[var(--bg)] text-[var(--text)] min-h-screen">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">📚 Từ điển của tôi</h1>
        <p className="text-sm opacity-70">Click vào từ để xem chi tiết</p>
      </div>

      {/* FILTER */}
      <Card className="p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="p-3 rounded-xl border bg-[var(--card)]"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "Tất cả chủ đề" : t}
              </option>
            ))}
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="p-3 rounded-xl border bg-[var(--card)]"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l === "all" ? "Tất cả trình độ" : l}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Tìm từ..."
            className="p-3 rounded-xl border bg-[var(--card)]"
          />
        </div>
      </Card>

      {/* TABLE */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              <th className="p-4">Từ</th>
              <th className="p-4">Nghĩa</th>
              <th className="p-4">Chủ đề</th>
              <th className="p-4">Trình độ</th>
              <th className="p-4">Trạng thái</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((w) => (
              <tr
                key={w.Id}
                onClick={() => setSelectedWord(w)}
                className="border-b hover:bg-[var(--card2)] cursor-pointer"
              >
                <td className="p-4 font-semibold">{w.Word}</td>
                <td className="p-4">{w.Meaning}</td>
                <td className="p-4">{w.TopicName}</td>
                <td className="p-4">{w.LevelName}</td>
                <td className="p-4">
                  {toBool(w.IsLearned) ? "⭐ Đã học" : "📖 Chưa học"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* PAGINATION */}
      <div className="flex gap-2 justify-center">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 border rounded"
        >
          ←
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-2">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 border rounded ${
                page === p ? "bg-blue-500 text-white" : ""
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded"
        >
          →
        </button>
      </div>

      {/* ================= MODAL DETAIL (UPDATED UX) ================= */}
      {selectedWord && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={() => setSelectedWord(null)}
        >
          <div
            className="bg-[var(--card)] p-6 rounded-2xl w-[520px] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold">{selectedWord.Word}</h2>

            <p>
              <b>Nghĩa:</b> {selectedWord.Meaning}
            </p>

            <p>
              <b>Phiên âm:</b> {selectedWord.Pronunciation || "-"}
            </p>

            <p>
              <b>Chủ đề:</b> {selectedWord.TopicName}
            </p>

            {/* EXAMPLE */}
            <div className="p-3 rounded bg-black/5">
              <p className="font-semibold">Ví dụ:</p>
              <p>{selectedWord.ExampleSentence || "Chưa có ví dụ"}</p>
              <p className="opacity-70 text-sm">
                {selectedWord.ExampleMeaning || ""}
              </p>
            </div>

            {/* SMART SRS DISPLAY (NEW UX) */}
            <div className="text-sm space-y-1 p-3 rounded bg-black/5">
              <p>
                🔁 <b>Số lần ôn:</b> {selectedWord.Repetition}
              </p>

              <p>
                ⏳ <b>Lần ôn tiếp:</b>{" "}
                {formatInterval(selectedWord.IntervalDays)}
              </p>

              <p>
                📊 <b>Độ khó:</b> {formatEase(selectedWord.EaseFactor)}
              </p>
            </div>

            {/* INSIGHT */}
            <p className="text-xs opacity-60">
              💡 Hệ thống sẽ tự điều chỉnh tần suất ôn dựa trên mức độ nhớ của
              bạn.
            </p>

            <button
              onClick={() => setSelectedWord(null)}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
