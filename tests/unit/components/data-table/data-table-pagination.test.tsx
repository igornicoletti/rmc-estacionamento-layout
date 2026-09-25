import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DataTablePagination } from "@/components/data-table/components/data-table-pagination"

function createTable() {
  return {
    state: { pagination: { pageIndex: 0, pageSize: 10 } },
    getPageCount: () => 3,
    getCanPreviousPage: () => false,
    getCanNextPage: () => true,
    firstPage: vi.fn(),
    lastPage: vi.fn(),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    setPageSize: vi.fn(),
  }
}

describe("DataTablePagination", () => {
  it("bloqueia somente o avanço enquanto exibe dados anteriores", () => {
    const table = createTable()
    table.getCanPreviousPage = () => true

    render(
      <DataTablePagination
        table={table}
        rowCount={11}
        isPlaceholderData
      />,
    )

    const navigationButtons = screen.getAllByRole("button")

    expect(navigationButtons).toHaveLength(4)
    expect(navigationButtons[0]).toBeEnabled()
    expect(navigationButtons[1]).toBeEnabled()
    expect(navigationButtons[2]).toBeDisabled()
    expect(navigationButtons[3]).toBeDisabled()
  })

  it("remove tamanhos inválidos e duplicados", async () => {
    const user = userEvent.setup()

    render(
      <DataTablePagination
        table={createTable()}
        rowCount={11}
        pageSizes={[-1, 0, 10, 10, Number.NaN, 25]}
      />,
    )

    await user.click(screen.getByRole("combobox"))

    expect(await screen.findAllByRole("option")).toHaveLength(2)
  })

  it("encaminha navegação e alteração de tamanho", async () => {
    const user = userEvent.setup()
    const table = createTable()

    table.getCanPreviousPage = () => true

    render(
      <DataTablePagination
        table={table}
        rowCount={11}
        pageSizes={[25]}
      />,
    )

    const navigationButtons = screen.getAllByRole("button")

    expect(navigationButtons).toHaveLength(4)

    for (const button of navigationButtons) {
      await user.click(button)
    }

    expect(table.firstPage).toHaveBeenCalledOnce()
    expect(table.previousPage).toHaveBeenCalledOnce()
    expect(table.nextPage).toHaveBeenCalledOnce()
    expect(table.lastPage).toHaveBeenCalledOnce()

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { selected: false }))

    expect(table.setPageSize).toHaveBeenCalledWith(25)
  })
})
