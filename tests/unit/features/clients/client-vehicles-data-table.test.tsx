import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { VehiclesDataTable } from "@/features/clients/vehicles/vehicles-data-table"
import { clientVehicleErpFixture } from "@/mocks/mock-vehicles-fixtures"
import { mapErpClientVehicles } from "@/features/clients/vehicles/vehicles-mapper"
import { formatLicensePlate } from "@/features/clients/vehicles/vehicles-format"

const allVehicles = mapErpClientVehicles(clientVehicleErpFixture)
const firstVehicle = allVehicles[0]

if (!firstVehicle) {
  throw new Error("Fixture de veículos vazia.")
}

const clientId = firstVehicle.clientId
const clientVehicles = allVehicles.filter(
  (vehicle) => vehicle.clientId === clientId,
)

async function renderVehiclesDataTable() {
  renderWithProviders(<VehiclesDataTable clientId={clientId} />)

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
    throw new Error("Primeira linha de dados não encontrada.")
  }

  return row
}

describe("VehiclesDataTable", () => {
  it("renderiza somente os veículos do cliente e preserva colunas internas ocultas", async () => {
    const table = await renderVehiclesDataTable()
    const rows = within(table).getAllByRole("row")
    const firstRow = getFirstDataRow(table)

    expect(rows).toHaveLength(clientVehicles.length + 1)
    expect(firstRow).toHaveTextContent(formatLicensePlate(firstVehicle.plate))
    expect(firstRow).not.toHaveTextContent(firstVehicle.clientId)
    expect(firstRow).not.toHaveTextContent(firstVehicle.clientTaxId)

    const root = table.closest<HTMLElement>('[data-slot="data-table-root"]')
    const toolbar = root?.querySelector<HTMLElement>('[data-slot="data-table-toolbar"]')

    if (!toolbar) {
      throw new Error("Toolbar não encontrada.")
    }

    expect(within(toolbar).getByRole("searchbox")).toHaveAccessibleName()
    expect(within(toolbar).getByRole("combobox")).toHaveAccessibleName()
  })

  it("copia dados funcionais do veículo selecionado", async () => {
    const user = userEvent.setup()
    const table = await renderVehiclesDataTable()
    const firstRow = getFirstDataRow(table)

    await user.click(within(firstRow).getByRole("button"))

    const menuItems = await screen.findAllByRole("menuitem")
    const copyAction = menuItems[0]

    if (!copyAction) {
      throw new Error("Ação de cópia não encontrada.")
    }

    await user.click(copyAction)

    const copied = await navigator.clipboard.readText()

    expect(copied).toContain(firstVehicle.clientId)
    expect(copied).toContain(formatLicensePlate(firstVehicle.plate))
  })

  it("encontra o veículo pela placa formatada", async () => {
    const user = userEvent.setup()
    const table = await renderVehiclesDataTable()

    await user.type(screen.getByRole("searchbox"), formatLicensePlate(firstVehicle.plate))

    expect(within(table).getAllByRole("row")).toHaveLength(2)
    expect(getFirstDataRow(table)).toHaveTextContent(formatLicensePlate(firstVehicle.plate))
  })
})
