import { createMemoryRouter } from "react-router"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import App from "@/app/bootstrap/app"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-status"

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

  it("resolve deep links do catálogo", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/seguranca-da-conta"],
    })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Segurança da conta" }),
    ).toBeInTheDocument()
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
