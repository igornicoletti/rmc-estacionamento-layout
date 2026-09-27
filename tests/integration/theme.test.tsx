import { act } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider } from "@/components/theme/theme-provider"
import { useTheme } from "@/hooks/use-theme"

const defaultMatchMedia = window.matchMedia.bind(window)

function ThemeControls() {
  const { setTheme } = useTheme()

  return (
    <button
      type="button"
      aria-label="select-dark-theme"
      onClick={() => setTheme("dark")}
    />
  )
}

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.style.colorScheme = ""

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: defaultMatchMedia,
    writable: true,
  })
})

describe("theme", () => {
  it("persiste a preferência selecionada e aplica o esquema resolvido", async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    )

    await user.click(
      screen.getByRole("button", { name: "select-dark-theme" }),
    )

    expect(window.localStorage.getItem("rmc-ui-theme")).toBe("dark")
    expect(document.documentElement.style.colorScheme).toBe("dark")
  })

  it("acompanha mudanças da preferência do sistema", async () => {
    let matches = false
    let notifyChange: (() => void) | undefined

    const mediaQuery = {
      addEventListener: vi.fn(
        (
          eventName: string,
          listener: EventListenerOrEventListenerObject,
        ) => {
          if (eventName === "change" && typeof listener === "function") {
            notifyChange = () => listener(new Event("change"))
          }
        },
      ),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
      get matches() {
        return matches
      },
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => mediaQuery),
      writable: true,
    })

    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(document.documentElement.style.colorScheme).toBe("light")
    })

    matches = true

    act(() => {
      notifyChange?.()
    })

    await waitFor(() => {
      expect(document.documentElement.style.colorScheme).toBe("dark")
    })
  })
})
