import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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

  it("resolve a rota interna de validação sem registrá-la em appPages", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/rmc"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(
      Object.values(appPages).some((page) => page.path === "/rmc"),
    ).toBe(false)
    expect(
      await screen.findByRole("heading", { name: "RMC" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Visualizar aviso de inatividade" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Visualizar sessão encerrada" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Visualizar upload de avatar" }),
    ).toBeInTheDocument()
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
    "abre o histórico de sincronização em %s",
    async (pageId) => {
      const user = userEvent.setup()
      const page = appPages[pageId]
      const router = createMemoryRouter(routes, { initialEntries: [page.path] })

      render(<App initialSessionSnapshot={anonymousSession} router={router} />)

      const historyButton = await screen.findByRole("button", {
        name: "Histórico",
      })

      expect(historyButton).toBeEnabled()
      expect(
        screen.getByRole("button", { name: "Sincronizar" }),
      ).toBeDisabled()

      await user.click(historyButton)

      const dialog = await screen.findByRole("dialog", {
        name: "Histórico de sincronização",
      })

      expect(within(dialog).getByText("Sucesso")).toBeInTheDocument()
      expect(within(dialog).getByText("Parcial")).toBeInTheDocument()
      expect(within(dialog).getByText("Erro")).toBeInTheDocument()
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
