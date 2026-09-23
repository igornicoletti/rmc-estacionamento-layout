import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { UnitsDataTable } from "@/pages/units/components/units-data-table"

describe("UnitsDataTable", () => {
  it("renderiza dados normalizados sem expor metadados internos", () => {
    renderWithProviders(<UnitsDataTable />)

    expect(screen.getByText("18 unidades")).toBeInTheDocument()
    expect(screen.getByText("Unidade 01")).toBeInTheDocument()
    expect(screen.getByText("88.000.000/0001-32")).toBeInTheDocument()
    expect(screen.getAllByText("Bandeira Azul").length).toBeGreaterThan(0)
    expect(
      screen.queryByRole("columnheader", { name: "Hash da origem" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/IP|synthetic-unit/u)).not.toBeInTheDocument()
  })

  it("permite copiar o código da unidade", async () => {
    const user = userEvent.setup()
    renderWithProviders(<UnitsDataTable />)

    await user.click(
      screen.getByRole("button", { name: "Ações da unidade Unidade 01" }),
    )
    await user.click(
      await screen.findByRole("menuitem", { name: "Copiar código" }),
    )

    await expect(navigator.clipboard.readText()).resolves.toBe("1")
  })

  it("filtra unidades pela busca", async () => {
    const user = userEvent.setup()
    renderWithProviders(<UnitsDataTable />)

    const search = screen.getByRole("searchbox", { name: "Buscar unidades" })
    await user.type(search, "parana")
    await user.keyboard("{Enter}")

    expect(await screen.findByText("4 unidades")).toBeInTheDocument()
    expect(screen.getAllByText(/Curitiba/u).length).toBeGreaterThan(0)
  })

  it("ordena colunas permitidas e filtra pela cidade no próprio combobox", async () => {
    const user = userEvent.setup()
    renderWithProviders(<UnitsDataTable />)

    expect(
      screen.getByRole("button", { name: "Ordenar por Nome fantasia" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Ordenar por CNPJ" }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Ordenar por Nome fantasia" }),
    )
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Unidade 01")

    const cityFilter = screen.getByRole("combobox", {
      name: "Filtrar unidades por cidade",
    })
    await user.click(cityFilter)
    await user.type(cityFilter, "Curitiba")
    await user.click(
      await screen.findByRole("option", { name: /Curitiba/u }),
    )

    expect(screen.getByText("2 unidades")).toBeInTheDocument()
    expect(screen.getByText("Unidade 04")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Limpar filtros" }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Limpar filtro de cidade" }),
    )
    expect(screen.getByText("18 unidades")).toBeInTheDocument()
  })
})
