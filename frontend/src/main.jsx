import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/theme/ThemeProvider";

// ================= CONFIG =================
window.RIVE_WASM_URL = "/rive.wasm";

// ================= DEBUG =================
if (import.meta.env.DEV) {
  console.log("🔥 APP BOOT");
  console.log("🔑 LOCALSTORAGE TOKEN:", localStorage.getItem("token"));
}

// ================= RENDER =================
ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
