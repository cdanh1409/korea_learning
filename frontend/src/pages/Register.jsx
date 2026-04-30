import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
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
  // SUBMIT REGISTER
  // ======================
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🚀 REGISTER SUBMIT:", form);

    if (!form.email || !form.password) {
      console.log("❌ EMPTY FIELDS");
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      console.log("📤 CALL REGISTER API...");

      const res = await register(form);

      console.log("📥 RESPONSE:", res);

      if (!res.message) {
        console.log("❌ REGISTER FAILED:", res);
        alert(res.error || "Register failed");
        return;
      }

      // ======================
      // SUCCESS
      // ======================
      console.log("✅ REGISTER SUCCESS");

      alert("Đăng ký thành công");

      navigate("/login");
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
        <h2 className="text-xl font-bold mb-4 text-center">Register</h2>

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
          className="w-full bg-green-500 text-white p-2 rounded"
        >
          {loading ? "Loading..." : "Register"}
        </button>

        {/* LINK LOGIN */}
        <div className="text-center mt-3 text-sm">
          <span>Already have account? </span>

          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
