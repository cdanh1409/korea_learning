import axios from "axios";

// ================= CREATE INSTANCE =================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  console.log("================================");
  console.log("📦 API:", config.url);
  console.log("🔑 TOKEN RAW:", token);
  console.log("🔑 TOKEN TYPE:", typeof token);
  console.log("================================");

  if (!token) {
    console.log("❌ TOKEN MISSING → REQUEST WITHOUT AUTH");
  }

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };

    console.log("✅ AUTH HEADER ATTACHED");
  }

  return config;
});

// ================= RESPONSE INTERCEPTOR =================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 🔥 auto logout nếu token sai
    if (status === 401) {
      console.log("❌ TOKEN INVALID → LOGOUT");

      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
