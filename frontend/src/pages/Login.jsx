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

      // ================= AXIOS CALL =================
      const res = await api.post("/auth/login", form);
      const data = res.data;

      const token = data?.token;
      const user = data?.user;

      if (!token) {
        alert(data?.message || "Login failed");
        return;
      }

      setToken(token);
      setUser(user);

      navigate("/");
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      alert(err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
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
