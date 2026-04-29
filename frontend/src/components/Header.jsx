export default function Header() {
  return (
    <div className="flex justify-between items-center bg-white px-6 py-4 shadow-sm">
      <button
        className="
        bg-purple-600 hover:bg-purple-700
        text-white px-5 py-2 rounded-xl
        transition-all duration-200
        hover:scale-105
      "
      >
        Học ngay
      </button>

      <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
        <div className="w-9 h-9 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
        <span className="font-medium">Danh</span>
      </div>
    </div>
  );
}
