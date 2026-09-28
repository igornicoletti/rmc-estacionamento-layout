import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { appCopy } from "@/app/config/app-copy"
import { appPages } from "@/app/config/app-config"
import App from "@/app/app"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-types"
import { headerContent } from "@/components/header/header-content"
import {
  waitForRouterInitialization,
  waitForRouterLocation,
} from "@tests/support/router"

const defaultMatchMedia = window.matchMedia.bind(window)

async function renderApp(initialEntry = "/") {
  const router = createMemoryRouter(routes, {
    initialEntries: [initialEntry],
  })

  await waitForRouterInitialization(router)

  render(<App initialSessionSnapshot={anonymousSession} router={router} />)

  return router
}

function getNavigationGroupTriggers(navigation: HTMLElement) {
  return within(navigation)
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("aria-expanded"))
}

function getExpandedNavigationGroupTriggers(navigation: HTMLElement) {
  return getNavigationGroupTriggers(navigation).filter(
    (button) => button.getAttribute("aria-expanded") === "true",
  )
}

function queryNavigationLinkByPath(navigation: HTMLElement, path: string) {
  return within(navigation)
    .queryAllByRole("link")
    .find((link) => link.getAttribute("href") === path)
}

function getNavigationLinkByPath(navigation: HTMLElement, path: string) {
  const link = queryNavigationLinkByPath(navigation, path)

  if (!link) {
    throw new Error(`Link de navegação não encontrado para ${path}.`)
  }

  return link
}

async function openSectionContainingPath(
  navigation: HTMLElement,
  path: string,
  user: ReturnType<typeof userEvent.setup>,
) {
  const visibleLink = queryNavigationLinkByPath(navigation, path)

  if (visibleLink) {
    return visibleLink
  }

  const collapsedTriggers = getNavigationGroupTriggers(navigation).filter(
    (button) => button.getAttribute("aria-expanded") === "false",
  )

  for (const trigger of collapsedTriggers) {
    await user.click(trigger)

    const link = queryNavigationLinkByPath(navigation, path)

    if (link) {
      return link
    }
  }

  throw new Error(`Nenhuma seção expôs o link ${path}.`)
}

function mockMobileViewport() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query.includes("max-width: 767px"),
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
    writable: true,
  })
}

afterEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: defaultMatchMedia,
    writable: true,
  })
})

describe("app shell navigation", () => {
  it("deriva o item e a seção ativos da rota atual", async () => {
    await renderApp(appPages.users.path)

    const navigation = screen.getByRole("navigation")
    const currentLink = within(navigation).getByRole("link", {
      current: "page",
    })

    expect(currentLink).toHaveAttribute("href", appPages.users.path)
    expect(getExpandedNavigationGroupTriggers(navigation)).toHaveLength(1)
  })

  it("mantém o item pai ativo em uma rota descendente", async () => {
    await renderApp(`${appPages.clients.path}/123`)

    const navigation = screen.getByRole("navigation")
    const currentLink = within(navigation).getByRole("link", {
      current: "page",
    })

    expect(currentLink).toHaveAttribute("href", appPages.clients.path)
    expect(getExpandedNavigationGroupTriggers(navigation)).toHaveLength(1)
  })

  it("mantém somente uma seção aberta", async () => {
    const user = userEvent.setup()

    await renderApp(appPages.users.path)

    const navigation = screen.getByRole("navigation")
    const [activeTrigger] = getExpandedNavigationGroupTriggers(navigation)
    const collapsedTrigger = getNavigationGroupTriggers(navigation).find(
      (button) => button.getAttribute("aria-expanded") === "false",
    )

    if (!activeTrigger || !collapsedTrigger) {
      throw new Error("Seções de navegação insuficientes para o teste.")
    }

    await user.click(collapsedTrigger)

    expect(getExpandedNavigationGroupTriggers(navigation)).toHaveLength(1)
    expect(collapsedTrigger).toHaveAttribute("aria-expanded", "true")
    expect(activeTrigger).toHaveAttribute("aria-expanded", "false")
  })

  it("permite fechar manualmente a seção da rota ativa", async () => {
    const user = userEvent.setup()

    await renderApp(appPages.users.path)

    const navigation = screen.getByRole("navigation")
    const [activeTrigger] = getExpandedNavigationGroupTriggers(navigation)

    if (!activeTrigger) {
      throw new Error("Seção ativa não encontrada.")
    }

    await user.click(activeTrigger)

    expect(getExpandedNavigationGroupTriggers(navigation)).toHaveLength(0)
  })

  it("descarta o override manual ao navegar para outra seção", async () => {
    const user = userEvent.setup()
    const router = await renderApp(appPages.users.path)

    const navigation = screen.getByRole("navigation")
    const [activeTrigger] = getExpandedNavigationGroupTriggers(navigation)

    if (!activeTrigger) {
      throw new Error("Seção ativa não encontrada.")
    }

    await user.click(activeTrigger)
    expect(getExpandedNavigationGroupTriggers(navigation)).toHaveLength(0)

    await act(async () => {
      await router.navigate(appPages.clients.path)
    })

    await waitFor(() => {
      const currentLink = within(navigation).getByRole("link", {
        current: "page",
      })

      expect(currentLink).toHaveAttribute("href", appPages.clients.path)
      expect(getExpandedNavigationGroupTriggers(navigation)).toHaveLength(1)
    })
  })

  it("não mantém uma seção contextual ao navegar para um item principal", async () => {
    const user = userEvent.setup()
    const router = await renderApp(appPages.users.path)

    const navigation = screen.getByRole("navigation")
    const dashboardLink = getNavigationLinkByPath(
      navigation,
      appPages.dashboard.path,
    )
    const navigationComplete = waitForRouterLocation(
      router,
      appPages.dashboard.path,
    )

    await user.click(dashboardLink)

    await act(async () => {
      await navigationComplete
    })

    const currentLink = within(navigation).getByRole("link", {
      current: "page",
    })

    expect(currentLink).toHaveAttribute("href", appPages.dashboard.path)
    expect(getExpandedNavigationGroupTriggers(navigation)).toHaveLength(0)
  })

  it("fecha o menu mobile após navegar", async () => {
    mockMobileViewport()
    const user = userEvent.setup()

    await renderApp()

    await user.click(
      screen.getByRole("button", { name: headerContent.sidebar.open }),
    )

    const navigation = screen.getByRole("navigation")
    const clientsLink = await openSectionContainingPath(
      navigation,
      appPages.clients.path,
      user,
    )

    await user.click(clientsLink)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: headerContent.sidebar.open }),
      ).toBeInTheDocument()
    })
  })

  it("mantém a navegação funcional com a Sidebar recolhida", async () => {
    const user = userEvent.setup()

    await renderApp()

    await user.click(
      screen.getByRole("button", { name: appCopy.sidebar.collapse }),
    )

    const navigation = screen.getByRole("navigation")
    const clientsLink = getNavigationLinkByPath(
      navigation,
      appPages.clients.path,
    )

    await user.click(clientsLink)

    await waitFor(() => {
      const currentLink = within(navigation).getByRole("link", {
        current: "page",
      })

      expect(currentLink).toHaveAttribute("href", appPages.clients.path)
    })
  })
})
