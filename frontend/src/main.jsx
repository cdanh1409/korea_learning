import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/theme/ThemeProvider";

// ✅ MUST FIRST
window.RIVE_WASM_URL = "/rive.wasm";

console.log("🔥 APP BOOT");
console.log("🔑 LOCALSTORAGE TOKEN:", localStorage.getItem("token"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
