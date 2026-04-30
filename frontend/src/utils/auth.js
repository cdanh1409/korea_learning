export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const getUser = () => {
  const data = localStorage.getItem("user");

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (err) {
    console.log("❌ USER PARSE ERROR:", err);
    localStorage.removeItem("user");
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
