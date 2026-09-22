import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { UnitsDataTable } from "@/pages/units/components/units-data-table"

describe("UnitsDataTable", () => {
  it("renderiza dados normalizados, busca e cópia do código", async () => {
    const user = userEvent.setup()
    renderWithProviders(<UnitsDataTable />)

    expect(screen.getByText("15 unidades")).toBeInTheDocument()
    expect(screen.getByText("Iguatemi")).toBeInTheDocument()
    expect(screen.getByText("21.384.959/0001-48")).toBeInTheDocument()
    expect(screen.getAllByText("Ipiranga").length).toBeGreaterThan(0)
    expect(screen.queryByRole("columnheader", { name: "Hash da origem" })).not.toBeInTheDocument()
    expect(screen.queryByText("POSTO MONTE CARLO IGUATEMI LTDA")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Ações da unidade Iguatemi" }))
    await user.click(await screen.findByRole("menuitem", { name: "Copiar código" }))
    await expect(navigator.clipboard.readText()).resolves.toBe("1")

    const search = screen.getByRole("searchbox", { name: "Buscar unidades" })
    await user.type(search, "parana")
    await user.keyboard("{Enter}")

    expect(await screen.findByText("3 unidades")).toBeInTheDocument()
    expect(screen.getByText("Ponta Grossa BR-376")).toBeInTheDocument()
  })

  it("ordena colunas permitidas e filtra pela cidade no popup", async () => {
    const user = userEvent.setup()
    renderWithProviders(<UnitsDataTable />)

    expect(screen.getByRole("button", { name: "Ordenar por Nome fantasia" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Ordenar por CNPJ" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Ordenar por Nome fantasia" }))
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Cuiaba")

    await user.click(screen.getByRole("combobox", { name: "Filtrar por cidade" }))
    await user.click(await screen.findByRole("option", { name: /Mirassol/u }))

    expect(screen.getByText("1 unidade")).toBeInTheDocument()
    expect(screen.getByText("Interior Eventos")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Limpar filtro de cidade" }))
    expect(screen.getByText("15 unidades")).toBeInTheDocument()
  })
})
