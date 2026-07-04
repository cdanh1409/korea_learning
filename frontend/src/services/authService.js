//const API = "http://localhost:5000/api/auth";
const API = import.meta.env.VITE_API_URL + "/auth";
// ================= LOGIN =================
export const login = async (data) => {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    console.error("❌ LOGIN ERROR:", result);
    throw result;
  }

  return result;
};

// ================= REGISTER =================
export const register = async (data) => {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    console.error("❌ REGISTER ERROR:", result);
    throw result;
  }

  return result;
};
