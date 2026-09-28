import { act, render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter, matchRoutes } from "react-router"
import { describe, expect, it } from "vitest"

import {
  waitForRouterInitialization,
  waitForRouterLocation,
} from "@tests/support/router"

import { appRoutes, appPageRouteIds } from "@/app/app-routes"
import { appMetadata } from "@/app/app-metadata"
import { routes } from "@/app/app-route-tree"
import App from "@/app/app"
import { anonymousSession } from "@/features/auth/contracts/auth-types"

async function renderRoute(initialEntry = "/") {
  const router = createMemoryRouter(routes, {
    initialEntries: [initialEntry],
  })

  await waitForRouterInitialization(router)

  render(<App initialSessionSnapshot={anonymousSession} router={router} />)

  return router
}

async function expectShell() {
  await Promise.all([
    screen.findByRole("main", {}, { timeout: 5_000 }),
    screen.findByRole("navigation", {}, { timeout: 5_000 }),
  ])
}

async function expectDocumentTitle(title: string) {
  await waitFor(() => expect(document.title).toBe(title), { timeout: 5_000 })
}

describe("app routing", () => {
  it(
    "atualiza o título ao navegar e restaura a identidade na rota desconhecida",
    async () => {
      const router = await renderRoute(appRoutes.clients.path)

      await expectShell()
      await expectDocumentTitle(
        `${appRoutes.clients.browserTitle} | ${appMetadata.browserTitle}`,
      )

      await act(async () => {
        void router.navigate(appRoutes.units.path)
        await waitForRouterLocation(router, appRoutes.units.path)
      })
      await expectDocumentTitle(
        `${appRoutes.units.browserTitle} | ${appMetadata.browserTitle}`,
      )

      await act(async () => {
        void router.navigate("/nao-existe")
        await waitForRouterLocation(router, "/nao-existe")
      })
      await expectDocumentTitle(appMetadata.browserTitle)
    },
    30_000,
  )

  it("monta o shell na rota raiz", async () => {
    const router = await renderRoute()

    expect(router.state.location.pathname).toBe("/")
    expect(router.state.errors).toBeNull()
    await expectShell()
  })

  it.each(appPageRouteIds.map((id) => appRoutes[id]))(
    "resolve o deep link $path",
    async (page) => {
      const router = await renderRoute(page.path)

      expect(router.state.location.pathname).toBe(page.path)
      expect(router.state.errors).toBeNull()
      await expectShell()
    },
  )

  it("resolve a rota interna sem registrá-la em appRoutes", async () => {
    const router = await renderRoute()
    const publicPagePaths: string[] = appPageRouteIds
      .map((id) => appRoutes[id])
      .map((page) => page.path)

    expect(publicPagePaths).not.toContain("/rmc")

    await act(async () => {
      void router.navigate("/rmc")
      await waitForRouterLocation(router, "/rmc")
    })

    expect(router.state.location.pathname).toBe("/rmc")
    expect(router.state.errors).toBeNull()
    await expectShell()
  }, 30_000)

  it("reconhece a rota dinâmica de detalhe do cliente", () => {
    const matches = matchRoutes(routes, "/clientes/3492")

    expect(matches?.some((match) => match.route.id === "client-details")).toBe(
      true,
    )
  })

  it("mantém o fallback desconhecido fora do shell", async () => {
    const router = await renderRoute("/usuarios")

    await act(async () => {
      void router.navigate("/nao-existe")
      await waitForRouterLocation(router, "/nao-existe")
    })

    expect(router.state.location.pathname).toBe("/nao-existe")
    expect(router.state.errors).toBeNull()
    expect(await screen.findByRole("main")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
    })
  }, 30_000)
})
