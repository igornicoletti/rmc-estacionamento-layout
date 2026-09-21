import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { createMockUsersRepository } from "@/mocks/users/users-repository.mock"
import { renderWithProviders } from "@tests/support/render"

import { UsersTable } from "@/features/users/components/users-table"

describe("UsersTable", () => {
  it("pagina a base de usuários com os componentes compartilhados", async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersTable repository={createMockUsersRepository()} />)

    expect(await screen.findByText("Ana Martins")).toBeInTheDocument()
    expect(screen.getByText("12 usuários")).toBeInTheDocument()
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Próxima página" }))

    expect(await screen.findByText("Fábio Souza")).toBeInTheDocument()
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument()
  })

  it("busca sem acento e confirma imediatamente com Enter", async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersTable repository={createMockUsersRepository()} />)

    await screen.findByText("Ana Martins")
    const search = screen.getByRole("searchbox", { name: "Buscar usuários" })
    await user.type(search, "joao")
    await user.keyboard("{Enter}")

    expect(await screen.findByText("João Ribeiro")).toBeInTheDocument()
    expect(screen.getByText("1 usuário")).toBeInTheDocument()
    expect(screen.queryByText("Ana Martins")).not.toBeInTheDocument()
  })

  it("combina status e perfil com contagens facetadas cruzadas", async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersTable repository={createMockUsersRepository()} />)

    await screen.findByText("Ana Martins")
    const status = screen.getByRole("combobox", { name: "Filtrar usuários por status" })
    await user.click(status)
    const suspended = await screen.findByRole("option", { name: /Suspenso/ })
    expect(within(suspended).getByText("2")).toBeInTheDocument()
    await user.click(suspended)

    expect(await screen.findByText("2 usuários")).toBeInTheDocument()
    const role = screen.getByRole("combobox", { name: "Filtrar usuários por perfil" })
    await user.click(role)
    const manager = await screen.findByRole("option", { name: /Gestor/ })
    expect(within(manager).getByText("1")).toBeInTheDocument()
    await user.click(manager)

    await waitFor(() => expect(screen.queryByText("Diego Rocha")).not.toBeInTheDocument())
    expect(screen.getByText("Lucas Ferreira")).toBeInTheDocument()
    expect(screen.getByText("1 usuário")).toBeInTheDocument()
  })

  it("abre os detalhes do usuário pelo menu reutilizável", async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersTable repository={createMockUsersRepository()} />)

    await screen.findByText("Ana Martins")
    await user.click(screen.getByRole("button", { name: "Ações de Ana Martins" }))
    await user.click(await screen.findByRole("menuitem", { name: "Ver detalhes" }))

    const details = await screen.findByRole("dialog")
    expect(within(details).getByRole("heading", { name: "Ana Martins" })).toBeInTheDocument()
    expect(within(details).getByText("USR-001")).toBeInTheDocument()
    expect(within(details).getByText("ana.martins@rmc.local")).toBeInTheDocument()
  })
})
