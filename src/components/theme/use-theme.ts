import { useContext } from "react"

import { ThemeProviderContext, type ThemeProviderValue } from "@/components/theme/theme-context"

export function useTheme(): ThemeProviderValue {
  const context = useContext(ThemeProviderContext)

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
