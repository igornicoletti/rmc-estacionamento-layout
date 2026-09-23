import { screen } from "@testing-library/react"
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
