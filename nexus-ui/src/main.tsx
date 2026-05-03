import "./styles/index.css";

import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { AppRoot } from "@/app/AppRoot";
import { applyStoredThemeToDocument } from "@/shared/theme/theme.bootstrap";

applyStoredThemeToDocument();

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
