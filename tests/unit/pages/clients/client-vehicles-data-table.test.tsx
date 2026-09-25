import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { ClientVehiclesDataTable } from "@/pages/clients/components/client-vehicles-data-table"
import { clientVehicleErpFixture } from "@/pages/clients/data/client-erp.fixture"
import { mapErpClientVehicles } from "@/pages/clients/model/client-vehicle-mapper"
import {
  formatLicensePlate,
} from "@/pages/clients/model/client-presentation"

const allVehicles = mapErpClientVehicles(clientVehicleErpFixture)
const firstVehicle = allVehicles[0]

if (!firstVehicle) {
  throw new Error("Fixture de veículos vazia.")
}

const clientId = firstVehicle.clientId
const clientVehicles = allVehicles.filter(
  (vehicle) => vehicle.clientId === clientId,
)

async function renderClientVehiclesDataTable() {
  renderWithProviders(<ClientVehiclesDataTable clientId={clientId} />)

  const table = screen.getByRole("table")
  const root = table.closest('[data-slot="data-table-root"]')

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

describe("ClientVehiclesDataTable", () => {
  it("renderiza somente os veículos do cliente e preserva colunas internas ocultas", async () => {
    const table = await renderClientVehiclesDataTable()
    const rows = within(table).getAllByRole("row")
    const firstRow = getFirstDataRow(table)

    expect(rows).toHaveLength(clientVehicles.length + 1)
    expect(firstRow).toHaveTextContent(formatLicensePlate(firstVehicle.plate))
    expect(firstRow).not.toHaveTextContent(firstVehicle.clientId)
    expect(firstRow).not.toHaveTextContent(firstVehicle.clientTaxId)

    const root = table.closest('[data-slot="data-table-root"]')
    const toolbar = root?.querySelector('[data-slot="data-table-toolbar"]')

    if (!toolbar) {
      throw new Error("Toolbar não encontrada.")
    }

    expect(within(toolbar).getByRole("searchbox")).toHaveAccessibleName()
    expect(within(toolbar).getByRole("combobox")).toHaveAccessibleName()
  })

  it("abre os detalhes do veículo selecionado", async () => {
    const user = userEvent.setup()
    const table = await renderClientVehiclesDataTable()
    const firstRow = getFirstDataRow(table)
    const trigger = within(firstRow).getByRole("button")

    await user.click(trigger)

    const menuItems = await screen.findAllByRole("menuitem")
    const detailsAction = menuItems[0]

    if (!detailsAction) {
      throw new Error("Ação de detalhes não encontrada.")
    }

    await user.click(detailsAction)

    const dialog = await screen.findByRole("dialog")

    expect(dialog).toHaveAccessibleName()
    expect(dialog).toHaveTextContent(firstVehicle.clientId)
    expect(dialog).toHaveTextContent(formatLicensePlate(firstVehicle.plate))
  })

  it("copia dados funcionais do veículo selecionado", async () => {
    const user = userEvent.setup()
    const table = await renderClientVehiclesDataTable()
    const firstRow = getFirstDataRow(table)

    await user.click(within(firstRow).getByRole("button"))

    const menuItems = await screen.findAllByRole("menuitem")
    const copyAction = menuItems[1]

    if (!copyAction) {
      throw new Error("Ação de cópia não encontrada.")
    }

    await user.click(copyAction)

    const copied = await navigator.clipboard.readText()

    expect(copied).toContain(firstVehicle.clientId)
    expect(copied).toContain(formatLicensePlate(firstVehicle.plate))
  })
})
