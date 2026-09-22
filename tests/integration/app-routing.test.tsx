import { createMemoryRouter } from "react-router"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import App from "@/app/bootstrap/app"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-status"

describe("app routing", () => {
  it("preserva a página inicial", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "RMC Estacionamento" }),
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
