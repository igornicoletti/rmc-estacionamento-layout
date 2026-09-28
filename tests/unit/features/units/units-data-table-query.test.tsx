import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { unitErpFixture } from "@/mocks/mock-units-fixtures"
import type { Unit } from "@/features/units/units-types"
import { mapErpUnits } from "@/features/units/units-mapper"

const { loadDemoUnitsMock } = vi.hoisted(() => ({
  loadDemoUnitsMock: vi.fn(),
}))

vi.mock("@/features/units/units-query", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/features/units/units-query")
    >()

  return {
    ...actual,
    loadDemoUnits: loadDemoUnitsMock,
  }
})

import { UnitsDataTable } from "@/features/units/units-data-table"

const previewUnits = mapErpUnits(unitErpFixture)

function getDataTableRoot(table: HTMLElement) {
  const root = table.closest('[data-slot="data-table-root"]')

  if (!root) {
    throw new Error("DataTableRoot não encontrado.")
  }

  return root
}

describe("UnitsDataTable query boundary", () => {
  beforeEach(() => {
    loadDemoUnitsMock.mockReset()
  })

  it("mantém o boundary ocupado até a carga inicial concluir", async () => {
    let resolveUnits: ((units: Unit[]) => void) | undefined

    loadDemoUnitsMock.mockReturnValue(
      new Promise<Unit[]>((resolve) => {
        resolveUnits = resolve
      }),
    )

    renderWithProviders(<UnitsDataTable />)

    const table = screen.getByRole("table")
    const root = getDataTableRoot(table)

    expect(root).toHaveAttribute("aria-busy", "true")

    act(() => {
      resolveUnits?.(previewUnits)
    })

    await waitFor(() => {
      expect(root).toHaveAttribute("aria-busy", "false")
    })

    expect(within(table).getAllByRole("row").length).toBeGreaterThan(1)
  })

  it("isola a falha e permite refazer a consulta", async () => {
    const user = userEvent.setup()

    loadDemoUnitsMock
      .mockImplementationOnce(() => {
        throw new TypeError("transformação inválida")
      })
      .mockReturnValueOnce(previewUnits)

    renderWithProviders(<UnitsDataTable />)

    const alert = await screen.findByRole("alert")
    const retry = within(alert).getByRole("button")

    expect(retry).toHaveAccessibleName()

    await user.click(retry)

    const table = await screen.findByRole("table")
    const root = getDataTableRoot(table)

    await waitFor(() => {
      expect(root).toHaveAttribute("aria-busy", "false")
    })

    expect(loadDemoUnitsMock).toHaveBeenCalledTimes(2)
  })
})
