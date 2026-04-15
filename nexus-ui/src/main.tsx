import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DEFAULT_THEME } from "./shared/constants/theme";
import { STORAGE_KEYS } from "./shared/constants/storage";
import App from "./App";
import "./index.css";

const stored = localStorage.getItem(STORAGE_KEYS.theme);
const initialTheme = stored === "light" || stored === "dark" ? stored : DEFAULT_THEME;

document.documentElement.setAttribute("data-theme", initialTheme);
document.documentElement.classList.toggle("dark", initialTheme === "dark");

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
