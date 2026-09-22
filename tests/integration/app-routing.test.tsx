import { createMemoryRouter } from "react-router"
import { act, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import App from "@/app/app"
import { APP_BROWSER_TITLE, appPages } from "@/app/app-config"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-types"

describe("app routing", () => {
  it("abre o dashboard na rota raiz e atualiza o título da aba", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument()
    expect(document.title).toBe(
      "Dashboard | Portal Estacionamento — Rede Monte Carlo",
    )
  })

  it.each(Object.values(appPages))("resolve o deep link $path", async (page) => {
    const router = createMemoryRouter(routes, {
      initialEntries: [page.path],
    })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(
      await screen.findByRole("heading", { name: page.title }),
    ).toBeInTheDocument()
  })

  it("restaura a identidade da aba ao navegar para uma rota desconhecida", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/usuarios"] })
    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    await act(async () => { await router.navigate("/nao-existe") })

    expect(document.title).toBe(APP_BROWSER_TITLE)
    expect(router.state.location.pathname).toBe("/nao-existe")
  })

  it("apresenta 404 sanitizado para deep link desconhecido", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/nao-existe"],
    })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Conteúdo não encontrado" }),
    ).toBeInTheDocument()
  })
})
