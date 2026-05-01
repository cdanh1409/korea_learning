const TOKEN_KEY = "token";
const USER_KEY = "user";

// ================= TOKEN =================
export const setToken = (token) => {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// ================= USER =================
export const setUser = (user) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.log("❌ SET USER ERROR:", err);
  }
};

export const getUser = () => {
  const data = localStorage.getItem(USER_KEY);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (err) {
    console.log("❌ USER PARSE ERROR:", err);
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

// ================= LOGOUT (FULL CLEAN) =================
export const logout = () => {
  removeToken();
  removeUser();

  // optional: clear all auth-related cache
  // localStorage.clear();

  window.location.href = "/login"; // force reset app state
};
