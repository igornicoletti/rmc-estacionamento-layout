import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/root/app"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-types"

describe("app shell", () => {
  it("não oferece ação no estado sem novas notificações", async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    await user.click(
      await screen.findByRole("button", { name: /Abrir notificações/ }),
    )
    await user.click(screen.getByRole("button", { name: "Marcar todas como lidas" }))

    expect(
      await screen.findByRole("heading", { name: "Sem novas notificações" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Ver todas as notificações" }),
    ).not.toBeInTheDocument()
  })

  it("abre um grupo inativo sob demanda", async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    const navigation = await screen.findByRole("navigation")
    const linksBefore = within(navigation).getAllByRole("link").length
    const collapsedTrigger = within(navigation)
      .getAllByRole("button")
      .find((button) => button.getAttribute("aria-expanded") === "false")

    expect(collapsedTrigger).toBeDefined()
    if (!collapsedTrigger) {
      return
    }

    await user.click(collapsedTrigger)

    await waitFor(() => {
      expect(within(navigation).getAllByRole("link").length).toBeGreaterThan(
        linksBefore,
      )
    })
  })

  it("mantém somente um grupo de navegação aberto", async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    const navigation = await screen.findByRole("navigation")
    const registrations = within(navigation).getByRole("button", {
      name: "CADASTROS",
    })
    const management = within(navigation).getByRole("button", {
      name: "GESTÃO",
    })

    await user.click(registrations)
    expect(registrations).toHaveAttribute("aria-expanded", "true")

    await user.click(management)

    expect(management).toHaveAttribute("aria-expanded", "true")
    expect(registrations).toHaveAttribute("aria-expanded", "false")
  })

  it("mantém disponível a rota ativa do grupo atual", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/usuarios"],
    })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    const navigation = await screen.findByRole("navigation")
    const activeLink = within(navigation)
      .getAllByRole("link")
      .find((link) => link.getAttribute("aria-current") === "page")

    expect(activeLink).toBeDefined()
  })

  it("permite recolher manualmente o grupo da rota ativa", async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(routes, {
      initialEntries: ["/usuarios"],
    })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    const navigation = await screen.findByRole("navigation")
    const activeGroupTrigger = within(navigation)
      .getAllByRole("button")
      .find((button) => button.getAttribute("aria-expanded") === "true")

    expect(activeGroupTrigger).toBeDefined()
    if (!activeGroupTrigger) {
      return
    }

    await user.click(activeGroupTrigger)

    await waitFor(() => {
      expect(activeGroupTrigger).toHaveAttribute("aria-expanded", "false")
    })
  })
})
