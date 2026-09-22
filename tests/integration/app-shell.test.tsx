import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import App from "@/app/app"
import { routes } from "@/app/routing/routes"
import { anonymousSession } from "@/app/session/session-types"
import { SidebarHeaderBar } from "@/components/sidebar/sidebar-header"
import { SidebarProvider } from "@/components/ui/sidebar"

describe("app shell", () => {
  it("monta sidebar e abre grupos inativos sob demanda", async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    expect(
      await screen.findByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Unidades" }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "CADASTROS" }))

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
    const user = userEvent.setup()
    const router = createMemoryRouter(routes, { initialEntries: ["/"] })

    render(<App initialSessionSnapshot={anonymousSession} router={router} />)

    const trigger = await screen.findByRole("button", {
      name: "Abrir notificações, 3 não lidas",
    })
    await user.click(trigger)

    await user.click(
      await screen.findByRole("button", { name: "Marcar todas como lidas" }),
    )

    expect(
      screen.getByRole("button", { name: "Abrir notificações" }),
    ).toBeInTheDocument()
  })

  it("mantém o nome acessível do trigger coerente com o estado", async () => {
    const user = userEvent.setup()

    render(
      <SidebarProvider defaultOpen={false}>
        <SidebarHeaderBar>
          <span>ações</span>
        </SidebarHeaderBar>
      </SidebarProvider>,
    )

    const trigger = screen.getByRole("button", { name: "Abrir menu lateral" })
    await user.click(trigger)

    expect(
      screen.getByRole("button", { name: "Fechar menu lateral" }),
    ).toBeInTheDocument()
  })
})
