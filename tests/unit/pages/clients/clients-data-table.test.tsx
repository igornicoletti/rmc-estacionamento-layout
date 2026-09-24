import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { ClientsDataTable } from "@/pages/clients/components/clients-data-table"

function renderClientsDataTable() {
  renderWithProviders(
    <MemoryRouter>
      <ClientsDataTable />
    </MemoryRouter>,
  )
}

describe("ClientsDataTable", () => {
  it("renderiza fixtures seguras sem expor colunas ocultas", async () => {
    renderClientsDataTable()

    expect(await screen.findByText("24 clientes")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Cliente Demonstracao 01/u }),
    ).toHaveAttribute("href", "/clientes/1001")
    expect(screen.getByText("cliente1@example.invalid")).toBeInTheDocument()
    expect(
      screen.queryByRole("columnheader", { name: "Telefone" }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Exportar CSV" }),
    ).toBeInTheDocument()
  })

  it("permite copiar e-mails adicionais", async () => {
    const user = userEvent.setup()
    renderClientsDataTable()

    const additionalEmails = await screen.findByRole("button", {
      name: "2 e-mails adicionais",
    })
    await user.hover(additionalEmails)

    expect(
      await screen.findByText("financeiro@example.invalid"),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", {
        name: "Copiar financeiro@example.invalid",
      }),
    )

    await expect(navigator.clipboard.readText()).resolves.toBe(
      "financeiro@example.invalid",
    )
  })

  it("abre os detalhes do cliente pelo menu de ações", async () => {
    const user = userEvent.setup()
    renderClientsDataTable()

    const actions = await screen.findAllByRole("button", {
      name: /Ações do cliente/u,
    })

    await user.click(actions[0])
    await user.click(
      await screen.findByRole("menuitem", { name: "Detalhes" }),
    )

    const sheet = await screen.findByRole("dialog", {
      name: "Cliente Demonstracao 01 Ltda",
    })
    expect(within(sheet).getByText("Contato")).toBeInTheDocument()
    expect(
      within(sheet).getByText(
        "cliente1@example.invalid, financeiro@example.invalid, frota@example.invalid",
      ),
    ).toBeInTheDocument()
  })

  it("copia os dados completos do cliente", async () => {
    const user = userEvent.setup()
    renderClientsDataTable()

    const actions = await screen.findAllByRole("button", {
      name: /Ações do cliente/u,
    })

    await user.click(actions[0])
    await user.click(
      await screen.findByRole("menuitem", { name: "Copiar dados" }),
    )

    const copied = await navigator.clipboard.readText()
    expect(copied).toContain("Código: 1001")
    expect(copied).toContain("E-mail: cliente1@example.invalid")
    expect(copied.split("\n").length).toBeGreaterThan(10)
  })

  it("expõe as cidades disponíveis no filtro", async () => {
    const user = userEvent.setup()
    renderClientsDataTable()

    const cityFilter = await screen.findByRole("combobox", {
      name: "Filtrar clientes por cidade",
    })
    await user.click(cityFilter)

    expect(
      await screen.findByRole("option", { name: /São José do Rio Preto/u }),
    ).toBeInTheDocument()
  })
})
