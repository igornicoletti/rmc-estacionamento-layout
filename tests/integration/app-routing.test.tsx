import { act, render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter, matchRoutes } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/root/app"
import "@/components/data-table/components/data-table-preview"
import "@/pages/clients/components/clients-data-table"
import "@/pages/units/components/units-data-table"
import { appPages } from "@/app/config/app-config"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-types"

const dataTablePages = [
  "users",
  "notifications",
  "audit",
  "permissions",
  "units",
  "clients",
  "prices",
  "rules",
] as const

describe("app routing", () => {
  it("monta o shell na rota raiz", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(await screen.findByRole("main")).toBeInTheDocument()
    expect(screen.getByRole("navigation")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/")
  })

  it.each(Object.values(appPages))("resolve o deep link $path", async (page) => {
    const router = createMemoryRouter(routes, {
      initialEntries: [page.path],
    })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(page.path)
    })
    expect(await screen.findByRole("main")).toBeInTheDocument()
    expect(screen.getByRole("navigation")).toBeInTheDocument()
  })

  it("resolve a rota dinâmica de detalhe do cliente", () => {
    const matches = matchRoutes(routes, "/clientes/3492")

    expect(matches?.some((match) => match.route.id === "client-details")).toBe(
      true,
    )
  })

  it.each(dataTablePages)("renderiza a tabela mínima em %s", async (pageId) => {
    const page = appPages[pageId]
    const router = createMemoryRouter(routes, { initialEntries: [page.path] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(
      await screen.findByRole("table", undefined, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: page.title })).toBeInTheDocument()
    expect(screen.getAllByRole("separator").length).toBeGreaterThan(0)
  })

  it.each(["units", "clients"] as const)(
    "expõe ações de histórico e sincronização em %s",
    async (pageId) => {
      const page = appPages[pageId]
      const router = createMemoryRouter(routes, { initialEntries: [page.path] })

      render(<App initialSessionSnapshot={anonymousSession} router={router} />)

      expect(
        await screen.findByRole("button", { name: "Histórico" }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: "Sincronizar" }),
      ).toBeInTheDocument()
    },
  )

  it("mantém o fallback desconhecido fora do shell", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/usuarios"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    await act(async () => {
      await router.navigate("/nao-existe")
    })

    expect(router.state.location.pathname).toBe("/nao-existe")
    expect(screen.getByRole("main")).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
    })
  })
})
