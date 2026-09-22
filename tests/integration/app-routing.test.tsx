import { render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/root/app"
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

  it.each(dataTablePages)("renderiza a tabela mínima em %s", async (pageId) => {
    const page = appPages[pageId]
    const router = createMemoryRouter(routes, { initialEntries: [page.path] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(await screen.findByRole("table")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: page.title })).toBeInTheDocument()
    expect(screen.getByRole("separator")).toBeInTheDocument()
  })

  it("mantém o fallback desconhecido fora do shell", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/usuarios"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    await router.navigate("/nao-existe")

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/nao-existe")
    })
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
  })
})
