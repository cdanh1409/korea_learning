import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/theme/ThemeProvider";
console.log("🔥 APP BOOT");
console.log("🔑 LOCALSTORAGE TOKEN:", localStorage.getItem("token"));
// ================= DEBUG FETCH GUARD =================
window.fetch = ((original) =>
  function (...args) {
    console.warn("⚠️ RAW FETCH USED:", args[0]);
    return original.apply(this, args);
  })(window.fetch);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
