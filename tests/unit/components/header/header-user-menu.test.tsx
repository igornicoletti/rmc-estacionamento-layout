import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, useLocation } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { headerContent } from "@/components/header/header-content"
import { HeaderUserMenu } from "@/components/header/header-user-menu"
import { ThemeProvider } from "@/components/theme/theme-provider"

const content = headerContent.userMenu

function Location() {
  return <output aria-label="location">{useLocation().pathname}</output>
}

function renderMenu(isSigningOut = false, onLogout = vi.fn()) {
  const ui = (pending: boolean) => (
    <MemoryRouter>
      <ThemeProvider>
        <HeaderUserMenu
          isSigningOut={pending}
          name="Usuária"
          onLogout={onLogout}
          profileTo="/profile-test"
        />
        <Location />
      </ThemeProvider>
    </MemoryRouter>
  )
  const result = render(ui(isSigningOut))
  return {
    ...result,
    onLogout,
    setPending: (pending: boolean) => result.rerender(ui(pending)),
  }
}

afterEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.style.colorScheme = ""
})

describe("HeaderUserMenu", () => {
  it("abre o menu e navega para o destino de perfil recebido", async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole("button", { name: content.trigger }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    await user.click(screen.getByRole("menuitem", { name: content.profile }))
    await waitFor(() => {
      expect(screen.getByLabelText("location")).toHaveTextContent("/profile-test")
    })
  })

  it("altera e persiste o tema pelo submenu", async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole("button", { name: content.trigger }))
    const appearance = await screen.findByRole("menuitem", {
      name: content.appearance,
    })
    appearance.focus()
    await user.keyboard("{ArrowRight}")
    await screen.findByRole("menuitemradio", { name: content.themeDark })
    await user.keyboard("{ArrowDown}{Enter}")
    expect(window.localStorage.getItem("rmc-ui-theme")).toBe("dark")
    expect(document.documentElement.style.colorScheme).toBe("dark")
  })

  it("encaminha o logout ao consumidor", async () => {
    const user = userEvent.setup()
    const { onLogout } = renderMenu()
    await user.click(screen.getByRole("button", { name: content.trigger }))
    await user.click(await screen.findByRole("menuitem", { name: content.signOut }))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it("impede outro logout enquanto a operação está pendente", async () => {
    const user = userEvent.setup()
    const { onLogout, setPending } = renderMenu(true)
    await user.click(screen.getByRole("button", { name: content.trigger }))
    const signOut = await screen.findByRole("menuitem", { name: content.signingOut })
    expect(signOut).toHaveAttribute("aria-disabled", "true")
    await user.click(signOut)
    await user.click(signOut)
    expect(onLogout).not.toHaveBeenCalled()
    setPending(false)
    await user.click(await screen.findByRole("menuitem", { name: content.signOut }))
    expect(onLogout).toHaveBeenCalledOnce()
  })
})
