import { readThemeFromStorage, syncThemeToDom } from "./theme-sync";

export function applyStoredThemeToDocument() {
  syncThemeToDom(readThemeFromStorage());
}
