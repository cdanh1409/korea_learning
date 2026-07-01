import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axios from "axios";

import Card from "../components/common/Card";
import api from "../utils/api";

/* ================= CONSTANTS ================= */
const LEVELS = ["all", "Sơ cấp", "Trung cấp", "Cao cấp"];
const PAGE_SIZE = 10;

/* ================= HELPERS ================= */
const toBool = (v) => v === true || v === 1 || v === "1";

/* ================= PAGINATION ================= */
const getPagination = (page, totalPages) => {
  const pages = [];

  if (totalPages <= 1) return [1];

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

export default function Words() {
  /* ================= STATE ================= */
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [level, setLevel] = useState("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [allTopics, setAllTopics] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(true);

  /* ================= REFS ================= */
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const noteTimeout = useRef(null);

  /* ================= TOPICS ================= */
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get("/words/topics");
        setAllTopics(res.data?.data || []);
      } catch (err) {
        console.error("GET TOPICS ERROR:", err);
      }
    };

    fetchTopics();
  }, []);

  const topics = useMemo(() => {
    return ["all", ...allTopics.map((t) => t?.Name).filter(Boolean)];
  }, [allTopics]);

  /* ================= PAGE CLAMP ================= */
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages || 1));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, topic, level]);

  /* ================= LOAD WORDS ================= */
  const loadWords = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // cancel previous request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      const requestId = ++requestIdRef.current;

      const safePage = Math.max(1, Math.min(page, totalPages || 1));

      const res = await api.get("/words", {
        params: {
          page: safePage,
          pageSize: PAGE_SIZE,
          search,
          topic,
          level,
        },
        signal: controller.signal,
      });

      // ignore stale response
      if (requestId !== requestIdRef.current) return;

      setData(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError("Không tải được dữ liệu từ server");
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, topic, level, totalPages]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  /* ================= PAGINATION UI ================= */
  const pages = useMemo(
    () => getPagination(page, totalPages),
    [page, totalPages],
  );

  /* ================= NOTE UPDATE (DEBOUNCE) ================= */
  const updateNote = useCallback((value, id) => {
    if (!id) return;

    setSelectedWord((prev) => (prev ? { ...prev, Note: value } : prev));

    setData((prev) =>
      prev.map((w) => (w.Id === id ? { ...w, Note: value } : w)),
    );

    clearTimeout(noteTimeout.current);

    setSavingNote(true);
    setNoteSaved(false);

    noteTimeout.current = setTimeout(async () => {
      try {
        await api.put(`/words/${id}/note`, { note: value });
        setNoteSaved(true);
      } catch {
        setNoteSaved(false);
      } finally {
        setSavingNote(false);
      }
    }, 500);
  }, []);

  /* ================= SPEAK ================= */
  const speakWord = (word) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "ko-KR";
    utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const koVoice =
      voices.find((v) => v.lang === "ko-KR") ||
      voices.find((v) => v.lang?.includes("ko"));

    if (koVoice) utterance.voice = koVoice;

    setTimeout(() => window.speechSynthesis.speak(utterance), 50);
  };

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      clearTimeout(noteTimeout.current);
      controllerRef.current?.abort();
    };
  }, []);

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-6 bg-[var(--bg)] text-[var(--text)] min-h-screen">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">📚 Từ điển của tôi</h1>
        <p className="text-sm opacity-70">Click vào từ để xem chi tiết</p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-3 bg-red-500/20 text-red-400 rounded-lg">{error}</div>
      )}

      {/* FILTER */}
      <Card className="p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-white/10 outline-none"
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
            className="p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-white/10 outline-none"
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
            className="p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-white/10 outline-none placeholder:opacity-60"
          />
        </div>
      </Card>

      {/* TABLE */}
      <Card>
        {loading ? (
          <div className="p-6 text-center">Đang tải...</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-center opacity-70">Không có dữ liệu</div>
        ) : (
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
              {data.map((w) => (
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
        )}
      </Card>

      {/* PAGINATION */}
      <div className="flex gap-2 justify-center">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ←
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`}>...</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={page === p ? "bg-blue-500 text-white px-2" : "px-2"}
            >
              {p}
            </button>
          ),
        )}

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          →
        </button>
      </div>

      {/* MODAL */}
      {selectedWord && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          onClick={() => {
            if (savingNote) clearTimeout(noteTimeout.current);
            setSelectedWord(null);
          }}
        >
          <div
            className="bg-[var(--card)] rounded-2xl w-full max-w-4xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CARD 1 */}
              <div className="p-4 rounded-xl bg-[var(--card2)] border border-white/10 shadow-md text-sm space-y-2">
                <h2 className="text-2xl font-bold">{selectedWord.Word}</h2>

                <p className="opacity-70">
                  {selectedWord.Pronunciation
                    ? `/${selectedWord.Pronunciation}/`
                    : "..."}
                </p>

                <p className="text-lg">{selectedWord.Meaning}</p>

                <button
                  className="mt-2 px-3 py-2 bg-blue-500 text-white rounded-lg"
                  onClick={() => speakWord(selectedWord.Word)}
                >
                  🔊 Phát âm chuẩn
                </button>
              </div>

              {/* CARD 2 */}
              <div className="p-4 rounded-xl bg-[var(--card2)] border border-white/10 shadow-md text-sm space-y-2">
                <p>
                  <b>Chủ đề:</b> {selectedWord.TopicName}
                </p>

                <p>
                  <b>Trình độ:</b> {selectedWord.LevelName}
                </p>

                <p>
                  <b>Loại từ:</b> {selectedWord.WordType || "-"}
                </p>

                <p>
                  <b>Số lần ôn:</b> {selectedWord.Repetition}
                </p>

                <p>
                  <b>Lần cuối:</b> {selectedWord.LastReviewDate || "-"}
                </p>

                <p>
                  <b>Trạng thái:</b>{" "}
                  {toBool(selectedWord.IsLearned) ? "⭐ Đã học" : "📖 Chưa học"}
                </p>
              </div>

              {/* CARD 3 */}
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-[var(--card2)] border border-white/10 shadow-md text-sm space-y-2">
                  <p className="font-semibold">Ví dụ</p>
                  <p>{selectedWord.ExampleSentence || "Chưa có ví dụ"}</p>
                  <p className="text-sm opacity-70">
                    {selectedWord.ExampleMeaning || ""}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="font-semibold">📝 Ghi chú</p>

                  <textarea
                    className="w-full p-3 rounded-lg border bg-transparent resize-none"
                    rows={6}
                    value={selectedWord.Note || ""}
                    onChange={(e) =>
                      updateNote(e.target.value, selectedWord.Id)
                    }
                    placeholder="Nhập ghi chú..."
                  />

                  <div className="text-xs mt-2 opacity-70">
                    {savingNote
                      ? "💾 Đang lưu..."
                      : noteSaved
                        ? "✅ Đã lưu"
                        : ""}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedWord(null)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
