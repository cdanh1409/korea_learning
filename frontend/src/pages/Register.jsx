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
  const [visible, setVisible] = useState({
    password: false,
    confirmPassword: false,
  });

  const [error, setError] = useState({});

  const navigate = useNavigate();

  // ================= INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ================= VALIDATE =================
  const validate = () => {
    const newError = {};

    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!email) newError.email = "Email không được để trống";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      newError.email = "Email không hợp lệ";
    }

    if (!password) newError.password = "Mật khẩu không được để trống";

    if (password && password.length < 6) {
      newError.password = "Mật khẩu phải >= 6 ký tự";
    }

    if (!confirmPassword) {
      newError.confirmPassword = "Vui lòng xác nhận mật khẩu";
    }

    if (password && confirmPassword && password !== confirmPassword) {
      newError.confirmPassword = "Mật khẩu không khớp";
    }

    setError(newError);

    return Object.keys(newError).length === 0;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const res = await register({
        email: form.email.trim(),
        password: form.password,
      });

      if (!res?.message) {
        setError({
          email: res?.error || "Đăng ký thất bại",
        });
        return;
      }

      navigate("/login");
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError({
        email: "Server error, vui lòng thử lại",
      });
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
            <LoginMascot
              showPassword={visible.password || visible.confirmPassword}
            />

            <h1>TOPIK AI</h1>
            <p>Tạo tài khoản để bắt đầu học TOPIK</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="login-title">Create Account ✨</h2>
            <p className="login-subtitle">Đăng ký để bắt đầu</p>

            {/* EMAIL */}
            <div>
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
              {error.email && (
                <p className="text-red-500 text-sm mt-1">{error.email}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="password-wrapper">
              <input
                type={visible.password ? "text" : "password"}
                name="password"
                value={form.password}
                placeholder="Password"
                onChange={handleChange}
                className="login-input"
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setVisible((p) => ({ ...p, password: !p.password }))
                }
              >
                {visible.password ? "🙈" : "👁"}
              </button>
            </div>
            {error.password && (
              <p className="text-red-500 text-sm mt-1">{error.password}</p>
            )}

            {/* CONFIRM PASSWORD */}
            <div className="password-wrapper">
              <input
                type={visible.confirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                placeholder="Confirm Password"
                onChange={handleChange}
                className="login-input"
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setVisible((p) => ({
                    ...p,
                    confirmPassword: !p.confirmPassword,
                  }))
                }
              >
                {visible.confirmPassword ? "🙈" : "👁"}
              </button>
            </div>

            {error.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {error.confirmPassword}
              </p>
            )}

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
