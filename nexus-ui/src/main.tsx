import "./index.css";

import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import App from "./App";
import { applyStoredThemeToDocument } from "./shared/theme/theme.bootstrap";

applyStoredThemeToDocument();

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
