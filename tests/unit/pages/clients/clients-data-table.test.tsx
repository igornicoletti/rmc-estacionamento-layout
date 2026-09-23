import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { ClientsDataTable } from "@/pages/clients/components/clients-data-table"

describe("ClientsDataTable", () => {
  it("renderiza fixtures seguras, filtra e permite copiar e-mails", async () => {
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter><ClientsDataTable /></MemoryRouter>)

    expect(await screen.findByText("24 clientes")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Cliente Demonstracao 01/u })).toHaveAttribute("href", "/clientes/1001")
    expect(screen.getByText("cliente1@example.invalid")).toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: "Telefone" })).not.toBeInTheDocument()

    const additionalEmails = screen.getByRole("button", { name: "2 e-mails adicionais" })
    await user.hover(additionalEmails)
    expect(await screen.findByText("financeiro@example.invalid")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Copiar financeiro@example.invalid" }))
    await expect(navigator.clipboard.readText()).resolves.toBe("financeiro@example.invalid")

    await user.click(screen.getByRole("combobox", { name: "Filtrar clientes por cidade" }))
    expect(await screen.findByRole("option", { name: /São José do Rio Preto/u })).toBeInTheDocument()
  })
})
