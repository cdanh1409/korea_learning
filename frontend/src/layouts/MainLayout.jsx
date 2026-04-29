import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header />

        <main className="flex-1 p-6 overflow-auto w-full">
          <Outlet /> {/* 👈 thay children */}
        </main>
      </div>
    </div>
  );
}
