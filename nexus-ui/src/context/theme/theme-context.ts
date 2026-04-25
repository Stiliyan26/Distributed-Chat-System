import { createContext } from "react";

import { type Theme } from "@/shared/constants/theme";

export type { Theme };

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
