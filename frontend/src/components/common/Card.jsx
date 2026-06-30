export default function Card({ children, className = "" }) {
  return (
    <div
      className={`
group relative w-full overflow-hidden        min-w-0  
        min-h-0

        rounded-2xl p-5

        bg-[var(--card)]
        border border-[var(--border)]

        shadow-[0_10px_40px_rgba(0,0,0,0.08)]
        backdrop-blur-xl

        transition-all duration-300 ease-out

        hover:shadow-[0_25px_70px_rgba(0,0,0,0.15)]
        hover:-translate-y-1
        hover:border-[var(--primary)]/30

        ${className}
      `}
    >
      {/* Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none isolate">
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-[90px] opacity-30"
          style={{ background: "var(--primary)" }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-[90px] opacity-20"
          style={{ background: "#ec4899" }}
        />
      </div>

      {/* Noise */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:10px_10px]" />

      {/* Content */}
      <div className="relative z-10 w-full min-h-0">{children}</div>
    </div>
  );
}
