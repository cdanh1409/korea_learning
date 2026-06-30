import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { setToken, setUser } from "../utils/auth";

import "../css/login.css";
import LoginMascot from "../components/ui/LoginMascot";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ================= INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ================= VALIDATE =================
  const validate = () => {
    if (!form.email || !form.password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Email không hợp lệ");
      return false;
    }

    return true;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const { data } = await api.post("/auth/login", form);

      if (!data?.token) {
        setError(data?.message || "Login failed");
        return;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);

      navigate("/");
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      setError(err?.response?.data?.message || "Sai email hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="login-container">
      <div className="login-box">
        {/* LEFT */}
        <div className="login-left">
          <div className="left-content">
            <LoginMascot showPassword={showPassword} />

            <h1>TOPIK AI</h1>

            <p>Học từ vựng TOPIK bằng AI và SRS thông minh</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="login-title">Welcome Back 👋</h2>
            <p className="login-subtitle">Đăng nhập để tiếp tục</p>

            {/* ERROR */}
            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            {/* EMAIL */}
            <input
              type="email"
              name="email"
              value={form.email}
              placeholder="Email"
              onChange={handleChange}
              className="login-input"
              autoComplete="email"
              disabled={loading}
            />

            {/* PASSWORD */}
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                placeholder="Password"
                onChange={handleChange}
                className="login-input"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            {/* SUBMIT */}
            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            {/* LINK */}
            <div className="login-link">
              Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
