import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { isTheme, ThemeProviderContext, type Theme } from "@/components/theme/theme-context"

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)"
const DEFAULT_STORAGE_KEY = "rmc-ui-theme"

function readStoredTheme(storageKey: string, fallback: Theme): Theme {
  if (typeof window === "undefined") {
    return fallback
  }

  try {
    const storedTheme = window.localStorage.getItem(storageKey)

    return isTheme(storedTheme) ? storedTheme : fallback
  } catch {
    return fallback
  }
}

function persistTheme(storageKey: string, theme: Theme): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(storageKey, theme)
  } catch {
    // Persistence is progressive enhancement. Theme selection remains
    // functional in memory when browser storage is unavailable.
  }
}

function applyResolvedTheme(theme: Exclude<Theme, "system">): void {
  const root = window.document.documentElement

  root.classList.remove("light", "dark")
  root.classList.add(theme)
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = DEFAULT_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    readStoredTheme(storageKey, defaultTheme),
  )

  useEffect(() => {
    if (theme !== "system") {
      applyResolvedTheme(theme)
      return
    }

    if (typeof window.matchMedia !== "function") {
      applyResolvedTheme("light")
      return
    }

    const mediaQuery = window.matchMedia(SYSTEM_DARK_QUERY)

    const applySystemTheme = () => {
      applyResolvedTheme(mediaQuery.matches ? "dark" : "light")
    }

    applySystemTheme()
    mediaQuery.addEventListener("change", applySystemTheme)

    return () => {
      mediaQuery.removeEventListener("change", applySystemTheme)
    }
  }, [theme])

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      persistTheme(storageKey, nextTheme)
      setThemeState(nextTheme)
    },
    [storageKey],
  )

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [setTheme, theme],
  )

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
