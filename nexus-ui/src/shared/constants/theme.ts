export enum Theme {
  DARK = "dark",
  LIGHT = "light",
}

export function isTheme(value: string | null | undefined): value is Theme {
  return Object.values(Theme).includes(value as Theme);
}
