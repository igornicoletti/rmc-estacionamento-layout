import { fireEvent, render, screen } from "@testing-library/react"
import { createMemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/app"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-types"

describe("app shell", () => {
  it("monta sidebar e abre grupos inativos sob demanda", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(
      await screen.findByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Unidades" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByText("CADASTROS"))

    expect(
      await screen.findByRole("link", { name: "Unidades" }),
    ).toBeInTheDocument()
  })

  it("mantém aberto o grupo que contém a rota ativa", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/usuarios"],
    })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(
      await screen.findByRole("link", { name: "Usuários" }),
    ).toHaveAttribute("aria-current", "page")
  })

  it("atualiza o preview de notificações sem duplicar ação", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    const trigger = await screen.findByRole("button", {
      name: "Abrir notificações, 3 não lidas",
    })
    fireEvent.click(trigger)

    fireEvent.click(
      await screen.findByRole("button", { name: "Marcar todas como lidas" }),
    )

    expect(
      screen.getByRole("button", { name: "Abrir notificações" }),
    ).toBeInTheDocument()
  })
})
