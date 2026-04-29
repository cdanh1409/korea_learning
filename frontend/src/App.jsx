import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Learn from "./pages/Learn";
import Review from "./pages/Review";
import Stats from "./pages/Stats";
import Settings from "./pages/Setting";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout cha */}
        <Route path="/" element={<MainLayout />}>
          {/* Các page con */}
          <Route index element={<Dashboard />} />
          <Route path="learn" element={<Learn />} />
          <Route path="review" element={<Review />} />
          <Route path="stats" element={<Stats />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
