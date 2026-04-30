import { useState } from "react";
import { login } from "../services/authService";
import { setToken, setUser } from "../utils/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ======================
  // INPUT CHANGE
  // ======================
  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log("✏️ INPUT:", name, value);

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================
  // SUBMIT LOGIN
  // ======================
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🚀 LOGIN SUBMIT:", form);

    if (!form.email || !form.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      console.log("📤 CALL API LOGIN...");

      const res = await login(form);

      console.log("📥 RESPONSE:", res);

      if (!res.token) {
        console.log("❌ LOGIN FAILED:", res);
        alert(res.error || "Login failed");
        return;
      }

      // ======================
      // SUCCESS
      // ======================
      console.log("✅ LOGIN SUCCESS");
      console.log("🔑 TOKEN:", res.token);

      setToken(res.token);
      setUser(res.user); // 👈 QUAN TRỌNG

      console.log("💾 TOKEN + USER SAVED");

      navigate("/");
      console.log("➡️ GO TO DASHBOARD");
    } catch (err) {
      console.log("🔥 ERROR:", err);
      alert("Server error");
    } finally {
      setLoading(false);
      console.log("⏹ LOADING OFF");
    }
  };

  // ======================
  // UI
  // ======================
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded w-[320px] shadow"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

        {/* EMAIL */}
        <input
          name="email"
          value={form.email}
          placeholder="Email"
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
        />

        {/* PASSWORD */}
        <input
          name="password"
          type="password"
          value={form.password}
          placeholder="Password"
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
        />

        {/* BUTTON */}
        <button
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        {/* REGISTER LINK */}
        <div className="text-center mt-3 text-sm">
          <span>Don't have an account? </span>
          <Link to="/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}
