import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { UnitsDataTable } from "@/pages/units/components/units-data-table"

const { downloadCsvMock } = vi.hoisted(() => ({
  downloadCsvMock: vi.fn(),
}))

vi.mock("@/lib/export-to-csv", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/export-to-csv")>()

  return {
    ...actual,
    downloadCsv: downloadCsvMock,
  }
})

async function renderUnitsDataTable() {
  renderWithProviders(<UnitsDataTable />)
  await screen.findByText("18 unidades")
}

describe("UnitsDataTable", () => {
  beforeEach(() => {
    downloadCsvMock.mockClear()
  })

  it("renderiza dados normalizados sem expor metadados internos", async () => {
    await renderUnitsDataTable()

    expect(screen.getByText("Unidade 01")).toBeInTheDocument()
    expect(screen.getByText("88.000.000/0001-32")).toBeInTheDocument()
    expect(screen.getAllByText("Bandeira Azul").length).toBeGreaterThan(0)
    expect(
      screen.queryByRole("columnheader", { name: "Hash da origem" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/IP|synthetic-unit/u)).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Exportar CSV" }),
    ).toBeInTheDocument()
  })

  it("abre os detalhes da unidade pelo menu de ações", async () => {
    const user = userEvent.setup()
    await renderUnitsDataTable()

    await user.click(
      screen.getByRole("button", { name: "Ações da unidade Unidade 01" }),
    )
    await user.click(
      await screen.findByRole("menuitem", { name: "Detalhes" }),
    )

    const sheet = await screen.findByRole("dialog", { name: "Unidade 01" })
    expect(within(sheet).getByText("Localização")).toBeInTheDocument()
    expect(within(sheet).getByText("88.000.000/0001-32")).toBeInTheDocument()
  })

  it("copia todos os dados da unidade", async () => {
    const user = userEvent.setup()
    await renderUnitsDataTable()

    await user.click(
      screen.getByRole("button", { name: "Ações da unidade Unidade 01" }),
    )
    await user.click(
      await screen.findByRole("menuitem", { name: "Copiar dados" }),
    )

    const copied = await navigator.clipboard.readText()
    expect(copied).toContain("Código: 1")
    expect(copied).toContain("CNPJ: 88.000.000/0001-32")
    expect(copied.split("\n").length).toBeGreaterThan(10)
  })

  it("exporta todas as unidades ordenadas antes da paginação", async () => {
    const user = userEvent.setup()
    await renderUnitsDataTable()

    const sortByName = screen.getByRole("button", {
      name: "Ordenar por Nome fantasia",
    })

    await user.click(sortByName)
    await user.click(sortByName)
    await user.click(
      screen.getByRole("button", { name: "Exportar CSV" }),
    )

    expect(downloadCsvMock).toHaveBeenCalledOnce()

    const [filename, csv] = downloadCsvMock.mock.calls[0] as [string, string]
    const records = csv.trimEnd().split("\r\n")

    expect(filename).toBe("unidades.csv")
    expect(records).toHaveLength(19)
    expect(records[1]).toContain("Unidade 18")
  })

  it("exporta somente as unidades que correspondem ao filtro ativo", async () => {
    const user = userEvent.setup()
    await renderUnitsDataTable()

    const cityFilter = screen.getByRole("combobox", {
      name: "Filtrar unidades por cidade",
    })

    await user.click(cityFilter)
    await user.type(cityFilter, "Curitiba")
    await user.click(
      await screen.findByRole("option", { name: /Curitiba/u }),
    )
    await user.click(
      screen.getByRole("button", { name: "Exportar CSV" }),
    )

    const [, csv] = downloadCsvMock.mock.calls[0] as [string, string]
    const records = csv.trimEnd().split("\r\n")

    expect(records).toHaveLength(3)
    expect(csv).toContain("Unidade 04")
    expect(csv).toContain("Unidade 12")
    expect(csv).not.toContain("Unidade 01")
  })

  it("filtra unidades pela busca", async () => {
    const user = userEvent.setup()
    await renderUnitsDataTable()

    const search = screen.getByRole("searchbox", { name: "Buscar unidades" })
    await user.type(search, "parana")
    await user.keyboard("{Enter}")

    expect(await screen.findByText("4 unidades")).toBeInTheDocument()
    expect(screen.getAllByText(/Curitiba/u).length).toBeGreaterThan(0)
  })

  it("exibe o estado vazio filtrado e permite limpar a busca", async () => {
    const user = userEvent.setup()
    await renderUnitsDataTable()

    const search = screen.getByRole("searchbox", { name: "Buscar unidades" })

    await user.type(search, "nao-existe")
    await user.keyboard("{Enter}")

    expect(
      await screen.findByText("Nenhum resultado encontrado"),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Limpar filtros" }),
    )

    expect(await screen.findByText("18 unidades")).toBeInTheDocument()
  })

  it("ordena colunas permitidas e filtra pela cidade no próprio combobox", async () => {
    const user = userEvent.setup()
    await renderUnitsDataTable()

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
