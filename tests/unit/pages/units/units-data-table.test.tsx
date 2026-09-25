import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { UnitsDataTable } from "@/pages/units/components/units-data-table"
import { unitErpFixture } from "@/pages/units/data/unit-erp.fixture"
import { mapErpUnits } from "@/pages/units/model/unit-mapper"
import {
  formatUnitCity,
  formatUnitName,
} from "@/pages/units/model/unit-presentation"

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

const previewUnits = mapErpUnits(unitErpFixture)
const firstUnit = previewUnits[0]

if (!firstUnit) {
  throw new Error("Fixture de unidades vazia.")
}

const cityCounts = previewUnits.reduce<Map<string, number>>((counts, unit) => {
  const key = `${unit.stateCode}:${unit.city}`
  counts.set(key, (counts.get(key) ?? 0) + 1)
  return counts
}, new Map())

const filterUnit = previewUnits.find((unit) => {
  const key = `${unit.stateCode}:${unit.city}`
  return (cityCounts.get(key) ?? 0) > 1 && unit.city !== firstUnit.city
})

if (!filterUnit) {
  throw new Error("Fixture precisa conter uma cidade repetida para filtragem.")
}

const filterKey = `${filterUnit.stateCode}:${filterUnit.city}`
const filteredUnits = previewUnits.filter(
  (unit) => `${unit.stateCode}:${unit.city}` === filterKey,
)

async function renderUnitsDataTable() {
  renderWithProviders(<UnitsDataTable />)

  const table = screen.getByRole("table")
  const root = table.closest<HTMLElement>('[data-slot="data-table-root"]')

  if (!root) {
    throw new Error("DataTableRoot não encontrado.")
  }

  await waitFor(() => {
    expect(root).toHaveAttribute("aria-busy", "false")
  })

  return table
}

function getFirstDataRow(table: HTMLElement) {
  const rows = within(table).getAllByRole("row")
  const row = rows[1]

  if (!row) {
    throw new Error("Primeira linha de unidade não encontrada.")
  }

  return row
}

function getToolbar(table: HTMLElement) {
  const root = table.closest<HTMLElement>('[data-slot="data-table-root"]')
  const toolbar = root?.querySelector<HTMLElement>('[data-slot="data-table-toolbar"]')

  if (!toolbar) {
    throw new Error("Toolbar não encontrada.")
  }

  return toolbar
}

function getExportButton(table: HTMLElement) {
  const toolbar = getToolbar(table)
  const actions = toolbar.querySelector<HTMLElement>(
    '[data-slot="data-table-toolbar-actions"]',
  )

  if (!actions) {
    throw new Error("Ações da toolbar não encontradas.")
  }

  const button = within(actions).getAllByRole("button")[0]

  if (!button) {
    throw new Error("Ação de exportação não encontrada.")
  }

  return button
}

describe("UnitsDataTable", () => {
  beforeEach(() => {
    downloadCsvMock.mockClear()
  })

  it("renderiza dados normalizados e mantém metadados internos ocultos", async () => {
    const table = await renderUnitsDataTable()
    const rows = within(table).getAllByRole("row")
    const firstRow = getFirstDataRow(table)

    expect(rows).toHaveLength(Math.min(previewUnits.length, 10) + 1)
    expect(firstRow).toHaveTextContent(formatUnitName(firstUnit.tradeName))
    expect(firstRow).toHaveTextContent(firstUnit.cnpj)
    expect(firstRow).toHaveTextContent(formatUnitName(firstUnit.brand))
    expect(firstRow).not.toHaveTextContent(firstUnit.synchronizedAt)
  })

  it("abre os detalhes da unidade selecionada", async () => {
    const user = userEvent.setup()
    const table = await renderUnitsDataTable()
    const firstRow = getFirstDataRow(table)

    await user.click(within(firstRow).getByRole("button"))

    const menuItems = await screen.findAllByRole("menuitem")
    const detailsAction = menuItems[0]

    if (!detailsAction) {
      throw new Error("Ação de detalhes não encontrada.")
    }

    await user.click(detailsAction)

    const dialog = await screen.findByRole("dialog")

    expect(dialog).toHaveAccessibleName()
    expect(dialog).toHaveTextContent(firstUnit.cnpj)
    expect(dialog).toHaveTextContent(formatUnitName(firstUnit.tradeName))
  })

  it("copia dados funcionais da unidade selecionada", async () => {
    const user = userEvent.setup()
    const table = await renderUnitsDataTable()
    const firstRow = getFirstDataRow(table)

    await user.click(within(firstRow).getByRole("button"))

    const menuItems = await screen.findAllByRole("menuitem")
    const copyAction = menuItems[1]

    if (!copyAction) {
      throw new Error("Ação de cópia não encontrada.")
    }

    await user.click(copyAction)

    const copied = await navigator.clipboard.readText()

    expect(copied).toContain(firstUnit.id)
    expect(copied).toContain(firstUnit.cnpj)
    expect(copied).toContain(formatUnitName(firstUnit.tradeName))
  })

  it("exporta o conjunto completo na ordem selecionada antes da paginação", async () => {
    const user = userEvent.setup()
    const table = await renderUnitsDataTable()
    const headers = within(table).getAllByRole("columnheader")
    const firstHeader = headers[0]

    if (!firstHeader) {
      throw new Error("Primeiro cabeçalho não encontrado.")
    }

    const sortButton = within(firstHeader).getByRole("button")

    await user.click(sortButton)
    await user.click(sortButton)
    await user.click(getExportButton(table))

    expect(downloadCsvMock).toHaveBeenCalledOnce()

    const [, csv] = downloadCsvMock.mock.calls[0] as [string, string]
    const records = csv.trimEnd().split("\r\n")

    const expectedFirst = [...previewUnits].sort(
      (left, right) => Number(right.id) - Number(left.id),
    )[0]

    if (!expectedFirst) {
      throw new Error("Unidade esperada não encontrada.")
    }

    expect(records).toHaveLength(previewUnits.length + 1)
    expect(records[1]).toContain(expectedFirst.id)
    expect(records[1]).toContain(formatUnitName(expectedFirst.tradeName))
  })

  it("exporta somente registros correspondentes à faceta ativa", async () => {
    const user = userEvent.setup()
    const table = await renderUnitsDataTable()
    const toolbar = getToolbar(table)
    const cityFilter = within(toolbar).getByRole("combobox")
    const cityLabel = formatUnitCity(filterUnit.city)

    await user.click(cityFilter)
    await user.type(cityFilter, cityLabel)

    const options = await screen.findAllByRole("option")
    const option = options[0]

    if (!option) {
      throw new Error("Opção filtrada de cidade não encontrada.")
    }

    await user.click(option)
    await user.click(getExportButton(table))

    expect(downloadCsvMock).toHaveBeenCalledOnce()

    const [, csv] = downloadCsvMock.mock.calls[0] as [string, string]
    const records = csv.trimEnd().split("\r\n")

    expect(records).toHaveLength(filteredUnits.length + 1)

    for (const unit of filteredUnits) {
      expect(csv).toContain(formatUnitName(unit.tradeName))
    }

    expect(csv).not.toContain(formatUnitName(firstUnit.tradeName))
  })

  it("encaminha a busca para o modelo local", async () => {
    const user = userEvent.setup()
    const table = await renderUnitsDataTable()
    const search = screen.getByRole("searchbox")

    fireEvent.change(search, {
      target: { value: formatUnitName(firstUnit.tradeName) },
    })
    fireEvent.keyDown(search, { code: "Enter", key: "Enter" })

    await waitFor(() => {
      expect(within(table).getAllByRole("row")).toHaveLength(2)
    })

    expect(getFirstDataRow(table)).toHaveTextContent(
      formatUnitName(firstUnit.tradeName),
    )
  })

  it("expõe estado vazio e permite limpar somente a busca ativa", async () => {
    const user = userEvent.setup()
    const table = await renderUnitsDataTable()
    const search = screen.getByRole("searchbox")

    fireEvent.change(search, {
      target: { value: "__registro_inexistente__" },
    })
    fireEvent.keyDown(search, { code: "Enter", key: "Enter" })

    await waitFor(() => {
      expect(within(table).getAllByRole("row")).toHaveLength(1)
    })

    expect(screen.getByRole("status")).toBeVisible()

    const inputGroup = search.closest<HTMLElement>('[data-slot="input-group"]')

    if (!inputGroup) {
      throw new Error("InputGroup da busca não encontrado.")
    }

    const clearSearch = within(inputGroup).getByRole("button")

    expect(clearSearch).toHaveAccessibleName()

    await user.click(clearSearch)

    await waitFor(() => {
      expect(within(table).getAllByRole("row").length).toBeGreaterThan(1)
    })
  })
})
