import { createContext } from "react"

export type Theme = "dark" | "light" | "system"

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light" || value === "system"
}

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
)
