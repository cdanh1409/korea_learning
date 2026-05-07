import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { setToken, setUser } from "../utils/auth";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setLoading(true);

      console.log("🔥 LOGIN START");
      console.log("📤 FORM DATA:", form);

      // ================= AXIOS CALL =================
      const res = await api.post("/auth/login", form);

      console.log("🔥 FULL RESPONSE:", res);
      console.log("🔥 RESPONSE DATA:", res.data);

      const data = res.data;

      // ================= DEBUG TOKEN PARSING =================
      const token = data?.token;
      const user = data?.user;

      console.log("🔑 TOKEN RAW:", token);
      console.log("👤 USER RAW:", user);

      if (!token) {
        console.log("❌ TOKEN IS NULL → CHECK BACKEND RESPONSE STRUCTURE");
        alert(data?.message || "Login failed");
        return;
      }

      // ================= SAVE =================
      setToken(token);
      setUser(user);

      localStorage.setItem("token", token);

      console.log("💾 SAVED TOKEN:", localStorage.getItem("token"));

      console.log("🚀 LOGIN SUCCESS → NAVIGATE");

      navigate("/");
    } catch (err) {
      console.log("❌ LOGIN ERROR FULL:", err);
      console.log("❌ RESPONSE ERROR:", err?.response?.data);

      alert(err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
      console.log("🏁 LOGIN FINISHED");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="p-6 border rounded w-[320px] space-y-3"
      >
        <h1 className="text-xl font-bold text-center">Login</h1>

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <button
          disabled={loading}
          className="bg-blue-500 text-white w-full p-2 rounded"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <div className="text-center text-sm">
          <Link to="/register" className="text-blue-500">
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}
