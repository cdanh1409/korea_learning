import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Learn from "./pages/Learn";
import Review from "./pages/Review";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Words from "./pages/Words";
import PrivateRoute from "./routes/PrivateRoute";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔥 DEFAULT ROUTE → REGISTER */}
        <Route path="/" element={<Navigate to="/register" />} />

        {/* 🔓 PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔒 PRIVATE */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="learn" element={<Learn />} />
          <Route path="review" element={<Review />} />
          <Route path="stats" element={<Stats />} />
          <Route path="settings" element={<Settings />} />
          <Route path="words" element={<Words />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
