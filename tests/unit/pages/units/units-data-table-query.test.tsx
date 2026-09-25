import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { unitErpFixture } from "@/pages/units/data/unit-erp.fixture"
import type { Unit } from "@/pages/units/model/unit"
import { mapErpUnits } from "@/pages/units/model/unit-mapper"

const { loadPreviewUnitsMock } = vi.hoisted(() => ({
  loadPreviewUnitsMock: vi.fn(),
}))

vi.mock("@/pages/units/data/unit-preview-data", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/pages/units/data/unit-preview-data")
    >()

  return {
    ...actual,
    loadPreviewUnits: loadPreviewUnitsMock,
  }
})

import { UnitsDataTable } from "@/pages/units/components/units-data-table"

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
    loadPreviewUnitsMock.mockReset()
  })

  it("mantém o boundary ocupado até a carga inicial concluir", async () => {
    let resolveUnits: ((units: Unit[]) => void) | undefined

    loadPreviewUnitsMock.mockReturnValue(
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

    loadPreviewUnitsMock
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

    expect(loadPreviewUnitsMock).toHaveBeenCalledTimes(2)
  })
})
