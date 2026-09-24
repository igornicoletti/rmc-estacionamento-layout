import { act, screen } from "@testing-library/react"
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

describe("UnitsDataTable query boundary", () => {
  beforeEach(() => {
    loadPreviewUnitsMock.mockReset()
  })

  it("mantém a tabela ocupada enquanto os dados iniciais estão pendentes", async () => {
    let resolveUnits: ((units: Unit[]) => void) | undefined

    loadPreviewUnitsMock.mockReturnValue(
      new Promise<Unit[]>((resolve) => {
        resolveUnits = resolve
      }),
    )

    renderWithProviders(<UnitsDataTable />)

    const table = screen.getByRole("table")
    expect(table.closest('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByText("18 unidades")).not.toBeInTheDocument()

    await act(async () => {
      resolveUnits?.(previewUnits)
    })

    expect(await screen.findByText("18 unidades")).toBeInTheDocument()
    expect(table.closest('[aria-busy="false"]')).not.toBeNull()
  })

  it("isola falha de transformação e permite tentar novamente", async () => {
    const user = userEvent.setup()

    loadPreviewUnitsMock
      .mockImplementationOnce(() => {
        throw new TypeError("transformação inválida")
      })
      .mockReturnValueOnce(previewUnits)

    renderWithProviders(<UnitsDataTable />)

    const retry = await screen.findByRole("button", {
      name: "Tentar novamente",
    })

    await user.click(retry)

    expect(await screen.findByText("18 unidades")).toBeInTheDocument()
    expect(loadPreviewUnitsMock).toHaveBeenCalledTimes(2)
  })
})
