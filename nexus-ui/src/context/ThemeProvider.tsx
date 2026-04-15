import React, { useCallback, useState } from "react";
import { STORAGE_KEYS } from "@/shared/constants/storage";
import { DEFAULT_THEME } from "@/shared/constants/theme";
import { ThemeContext, type Theme } from "./theme-context";

function warnThemeStorageFailure(action: "read" | "write", error: unknown) {
  if (import.meta.env.DEV) {
    console.warn(`Theme storage ${action} failed`, error);
  }
}

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.theme);

    if (v === "light" || v === "dark") {
      return v;
    }
  } catch (error) {
    warnThemeStorageFailure("read", error);
  }

  return DEFAULT_THEME;
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  document.documentElement.classList.toggle("dark", t === "dark");

  try {
    localStorage.setItem(STORAGE_KEYS.theme, t);
  } catch (error) {
    warnThemeStorageFailure("write", error);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";

      applyTheme(next);

      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
