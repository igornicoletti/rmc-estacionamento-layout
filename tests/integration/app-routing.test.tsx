import { act, render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter, matchRoutes } from "react-router"
import { describe, expect, it } from "vitest"

import { waitForRouterInitialization } from "@tests/support/router"

import { appPages } from "@/app/config/app-config"
import { routes } from "@/app/routing/routes"
import App from "@/app/root/app"
import { anonymousSession } from "@/app/session/session-types"

async function renderRoute(initialEntry = "/") {
  const router = createMemoryRouter(routes, {
    initialEntries: [initialEntry],
  })

  await waitForRouterInitialization(router)

  render(<App initialSessionSnapshot={anonymousSession} router={router} />)

  return router
}

describe("app routing", () => {
  it("monta o shell na rota raiz", async () => {
    const router = await renderRoute()

    expect(router.state.location.pathname).toBe("/")
    expect(router.state.errors).toBeNull()
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(screen.getByRole("navigation")).toBeInTheDocument()
  })

  it.each(Object.values(appPages))("resolve o deep link $path", async (page) => {
    const router = await renderRoute(page.path)

    expect(router.state.location.pathname).toBe(page.path)
    expect(router.state.errors).toBeNull()
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(screen.getByRole("navigation")).toBeInTheDocument()
  })

  it("resolve a rota interna sem registrá-la em appPages", async () => {
    const router = await renderRoute()
    const publicPagePaths: string[] = Object.values(appPages).map(
      (page) => page.path,
    )

    expect(publicPagePaths).not.toContain("/rmc")

    await act(async () => {
      await router.navigate("/rmc")
    })

    expect(router.state.location.pathname).toBe("/rmc")
    expect(router.state.errors).toBeNull()
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(screen.getByRole("navigation")).toBeInTheDocument()
  })

  it("reconhece a rota dinâmica de detalhe do cliente", () => {
    const matches = matchRoutes(routes, "/clientes/3492")

    expect(matches?.some((match) => match.route.id === "client-details")).toBe(
      true,
    )
  })

  it("mantém o fallback desconhecido fora do shell", async () => {
    const router = await renderRoute("/usuarios")

    await act(async () => {
      await router.navigate("/nao-existe")
    })

    expect(router.state.location.pathname).toBe("/nao-existe")
    expect(router.state.errors).toBeNull()
    expect(screen.getByRole("main")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
    })
  })
})
