import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div
      className="flex h-screen w-full overflow-hidden text-[var(--text)]"
      style={{ background: "var(--bg)" }}
    >
      {/* SIDEBAR */}
      <aside
        className="w-[260px] flex flex-col border-r shrink-0"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <Sidebar />
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* HEADER */}
        <header
          className="h-[64px] shrink-0"
          style={{
            background: "var(--card)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Header />
        </header>

        {/* CONTENT */}
        <main
          className="flex-1 min-h-0 min-w-0 overflow-hidden p-6"
          style={{ background: "var(--bg)" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
