import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/root/app"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-types"

type AppTestRouter = ReturnType<typeof createMemoryRouter>

function waitForRouterInitialization(router: AppTestRouter) {
  if (router.state.initialized) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const unsubscribe = router.subscribe((state) => {
      if (!state.initialized) {
        return
      }

      unsubscribe()
      resolve()
    })

    if (router.state.initialized) {
      unsubscribe()
      resolve()
    }
  })
}

async function renderApp(initialEntry = "/") {
  const router = createMemoryRouter(routes, {
    initialEntries: [initialEntry],
  })

  await waitForRouterInitialization(router)

  render(<App initialSessionSnapshot={anonymousSession} router={router} />)
}

function getNavigationGroupTriggers(navigation: HTMLElement) {
  return within(navigation)
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("aria-expanded"))
}

describe("app shell", () => {
  it("não oferece ação no estado sem novas notificações", async () => {
    const user = userEvent.setup()

    await renderApp()

    const notificationTrigger =
      document.querySelector<HTMLButtonElement>('[data-slot="popover-trigger"]')

    if (!notificationTrigger) {
      throw new Error("Trigger de notificações não encontrado.")
    }

    await user.click(notificationTrigger)

    const popover =
      document.querySelector<HTMLElement>('[data-slot="popover-content"]')

    if (!popover) {
      throw new Error("Popover de notificações não encontrado.")
    }

    await user.click(within(popover).getByRole("button"))

    expect(within(popover).queryByRole("button")).not.toBeInTheDocument()
    expect(within(popover).queryByRole("link")).not.toBeInTheDocument()
  })

  it("abre um grupo inativo sob demanda", async () => {
    const user = userEvent.setup()

    await renderApp()

    const navigation = screen.getByRole("navigation")
    const linksBefore = within(navigation).getAllByRole("link").length
    const collapsedTrigger = getNavigationGroupTriggers(navigation).find(
      (button) => button.getAttribute("aria-expanded") === "false",
    )

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

    await renderApp()

    const navigation = screen.getByRole("navigation")
    const collapsedTriggers = getNavigationGroupTriggers(navigation).filter(
      (button) => button.getAttribute("aria-expanded") === "false",
    )
    const firstTrigger = collapsedTriggers[0]
    const secondTrigger = collapsedTriggers[1]

    if (!firstTrigger || !secondTrigger) {
      throw new Error("Grupos de navegação insuficientes para o teste.")
    }

    await user.click(firstTrigger)
    expect(firstTrigger).toHaveAttribute("aria-expanded", "true")

    await user.click(secondTrigger)

    expect(secondTrigger).toHaveAttribute("aria-expanded", "true")
    expect(firstTrigger).toHaveAttribute("aria-expanded", "false")
  })

  it("mantém disponível a rota ativa do grupo atual", async () => {
    await renderApp("/usuarios")

    const navigation = screen.getByRole("navigation")

    expect(
      within(navigation).getByRole("link", { current: "page" }),
    ).toBeInTheDocument()
  })

  it("permite recolher manualmente o grupo da rota ativa", async () => {
    const user = userEvent.setup()

    await renderApp("/usuarios")

    const navigation = screen.getByRole("navigation")
    const [activeGroupTrigger] = within(navigation).getAllByRole("button", {
      expanded: true,
    })

    if (!activeGroupTrigger) {
      throw new Error("Grupo ativo não encontrado.")
    }

    await user.click(activeGroupTrigger)

    await waitFor(() => {
      expect(activeGroupTrigger).toHaveAttribute("aria-expanded", "false")
    })
  })
})
