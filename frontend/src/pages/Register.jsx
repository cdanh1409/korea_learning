import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

import "../css/login.css";
import LoginMascot from "../components/ui/LoginMascot";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // ================= INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password || !form.confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Mật khẩu không khớp");
      return;
    }

    try {
      setLoading(true);

      const res = await register({
        email: form.email,
        password: form.password,
      });

      if (!res?.message) {
        alert(res?.error || "Register failed");
        return;
      }

      alert("Đăng ký thành công");
      navigate("/login");
    } catch (err) {
      console.log("REGISTER ERROR:", err);
      alert("Server error");
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
            <LoginMascot showPassword={showPassword || showConfirmPassword} />

            <h1>TOPIK AI</h1>

            <p>Tạo tài khoản để bắt đầu học từ vựng TOPIK bằng AI thông minh</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="login-title">Create Account ✨</h2>

            <p className="login-subtitle">
              Đăng ký để bắt đầu hành trình học TOPIK
            </p>

            {/* EMAIL */}
            <input
              type="email"
              name="email"
              value={form.email}
              placeholder="Email"
              onChange={handleChange}
              className="login-input"
              autoComplete="email"
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
                autoComplete="new-password"
              />

              <button
                type="button"
                className="toggle-password"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                placeholder="Confirm Password"
                onChange={handleChange}
                className="login-input"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="toggle-password"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowConfirmPassword((p) => !p)}
              >
                {showConfirmPassword ? "🙈" : "👁"}
              </button>
            </div>

            {/* BUTTON */}
            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>

            {/* LINK */}
            <div className="login-link">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
