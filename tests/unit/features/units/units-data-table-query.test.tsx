import { act, screen, waitFor, within } from "@testing-library/react"
import {
  type QueryClient,
  useQueryClient,
} from "@tanstack/react-query"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { unitErpFixture } from "@/mocks/mock-units-fixtures"
import type { Unit } from "@/features/units/contracts/units-types"
import { mapErpUnits } from "@/features/units/mapping/units-mapper"

const { loadDemoUnitsMock, notifyMock } = vi.hoisted(() => ({
  loadDemoUnitsMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock("@/components/toast/toast-notify", () => ({
  notify: notifyMock,
}))

vi.mock("@/features/units/queries/units-query", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/features/units/queries/units-query")
    >()

  return {
    ...actual,
    loadDemoUnits: loadDemoUnitsMock,
  }
})

import { UnitsDataTable } from "@/features/units/components/units-data-table"
import { unitsQueryKeys } from "@/features/units/queries/units-query"

const previewUnits = mapErpUnits(unitErpFixture)
let activeQueryClient: QueryClient | null = null

function QueryClientCapture() {
  activeQueryClient = useQueryClient()
  return null
}

function renderUnitsDataTable() {
  renderWithProviders(
    <>
      <QueryClientCapture />
      <UnitsDataTable />
    </>,
  )
}

function getDataTableRoot(table: HTMLElement) {
  const root = table.closest('[data-slot="data-table-root"]')

  if (!root) {
    throw new Error("DataTableRoot não encontrado.")
  }

  return root
}

function getQueryClient() {
  if (!activeQueryClient) {
    throw new Error("QueryClient não encontrado.")
  }

  return activeQueryClient
}

describe("UnitsDataTable query boundary", () => {
  beforeEach(() => {
    activeQueryClient = null
    loadDemoUnitsMock.mockReset()
    notifyMock.mockReset()
  })

  it("mantém o boundary ocupado até a carga inicial concluir", async () => {
    let resolveUnits: ((units: Unit[]) => void) | undefined

    loadDemoUnitsMock.mockReturnValue(
      new Promise<Unit[]>((resolve) => {
        resolveUnits = resolve
      }),
    )

    renderUnitsDataTable()

    const table = screen.getByRole("table")
    const root = getDataTableRoot(table)

    expect(root).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("searchbox")).toBeDisabled()

    act(() => {
      resolveUnits?.(previewUnits)
    })

    await waitFor(() => {
      expect(root).toHaveAttribute("aria-busy", "false")
    })

    expect(screen.getByRole("searchbox")).not.toBeDisabled()
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(1)
  })

  it("isola a falha inicial e permite refazer a consulta", async () => {
    const user = userEvent.setup()

    loadDemoUnitsMock
      .mockImplementationOnce(() => {
        throw new TypeError("transformação inválida")
      })
      .mockReturnValueOnce(previewUnits)

    renderUnitsDataTable()

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

  it("preserva dados e notifica uma vez quando o refetch falha", async () => {
    loadDemoUnitsMock
      .mockResolvedValueOnce(previewUnits)
      .mockRejectedValueOnce(new Error("refetch indisponível"))

    renderUnitsDataTable()

    const table = await screen.findByRole("table")
    await waitFor(() => {
      expect(screen.getAllByTestId("data-table-row").length).toBeGreaterThan(0)
    })
    const root = getDataTableRoot(table)
    const visibleRows = screen.getAllByTestId("data-table-row").length

    await act(async () => {
      await getQueryClient().invalidateQueries({
        queryKey: unitsQueryKeys.units,
      })
    })

    await waitFor(() => {
      expect(root).toHaveAttribute("aria-busy", "false")
      expect(notifyMock).toHaveBeenCalledTimes(1)
    })

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.getAllByTestId("data-table-row")).toHaveLength(visibleRows)
  })
})
