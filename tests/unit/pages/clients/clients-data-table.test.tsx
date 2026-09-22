import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { ClientsDataTable } from "@/pages/clients/components/clients-data-table"

describe("ClientsDataTable", () => {
  it("renderiza a estrutura pronta para receber os dados do ERP", () => {
    renderWithProviders(<ClientsDataTable />)

    expect(screen.getByText("0 clientes")).toBeInTheDocument()
    expect(
      screen.getByRole("searchbox", { name: "Buscar clientes" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: "Filtrar por cidade" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: /Nome/u }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: /CPF\/CNPJ/u }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("columnheader", { name: "Hash da origem" }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Nenhum cliente disponível" }),
    ).toBeInTheDocument()
  })
})
