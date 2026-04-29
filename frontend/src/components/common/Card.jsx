export default function Card({ children, className = "" }) {
  return (
    <div
      className={`
        w-full  
        bg-white p-2 rounded-2xl
        shadow-sm
        hover:shadow-lg
        hover:-translate-y-1
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}
