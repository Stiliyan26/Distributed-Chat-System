import React, { useCallback, useState } from "react";

import { Theme } from "@/shared/constants/theme";
import {
  persistThemeAndSyncDom,
  readThemeFromStorage,
} from "@/shared/theme/theme-sync";

import { ThemeContext } from "./theme-context";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readThemeFromStorage);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === Theme.DARK ? Theme.LIGHT : Theme.DARK;

      persistThemeAndSyncDom(next);

      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
