import { getToken } from "./auth";

export const authFetch = (url, options = {}) => {
  const token = getToken();

  const headers = new Headers(options.headers || {});

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    console.warn("⚠️ NO TOKEN FOUND");
  }

  return fetch(url, {
    ...options,
    headers, // OK vì đây là Headers object chuẩn
  });
};
