import { STORAGE_KEYS } from "@/shared/constants/storage";
import { Theme, isTheme } from "@/shared/constants/theme";


export function persistThemeAndSyncDom(theme: Theme): void {
  syncThemeToDom(theme);
  writeThemeToStorage(theme);
}

export function syncThemeToDom(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle(Theme.DARK, theme === Theme.DARK);
}

export function readThemeFromStorage(): Theme {
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);

    if (isTheme(storedTheme)) {
      return storedTheme;
    }
  } catch (error) {
    warnThemeStorageFailure('read', error);
  }

  return Theme.DARK;
}

export function writeThemeToStorage(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch (error) {
    warnThemeStorageFailure('write', error);
  }
}

function warnThemeStorageFailure(action: 'read' | 'write', error: unknown) {
  if (import.meta.env.DEV) {
    console.warn(`Theme storage ${action} failed`, error);
  }
}