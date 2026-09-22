import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DataTablePagination } from "@/components/data-table/data-table-pagination"

function createTable() {
  return {
    state: { pagination: { pageIndex: 0, pageSize: 5 } },
    getPageCount: () => 3,
    getCanPreviousPage: () => false,
    getCanNextPage: () => true,
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    setPageSize: vi.fn(),
  }
}

describe("DataTablePagination", () => {
  it("bloqueia o avanço enquanto exibe dados anteriores", () => {
    render(
      <DataTablePagination
        table={createTable()}
        rowCount={11}
        isPlaceholderData
      />,
    )

    expect(
      screen.getByRole("button", { name: "Próxima página" }),
    ).toBeDisabled()
  })

  it("remove tamanhos inválidos e duplicados", async () => {
    const user = userEvent.setup()
    render(
      <DataTablePagination
        table={createTable()}
        rowCount={11}
        pageSizes={[-1, 0, 5, 5, Number.NaN, 10]}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "Linhas por página" }))
    expect(await screen.findAllByRole("option")).toHaveLength(2)
    expect(screen.getByRole("option", { name: "5" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "10" })).toBeInTheDocument()
  })

  it("navega, altera o tamanho e usa o rótulo singular", async () => {
    const user = userEvent.setup()
    const table = createTable()
    table.getCanPreviousPage = () => true

    render(
      <DataTablePagination
        table={table}
        rowCount={1}
        pageSizes={[10]}
        itemLabel={{ singular: "item", plural: "itens" }}
      />,
    )

    expect(screen.getByText("1 item")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Página anterior" }))
    await user.click(screen.getByRole("button", { name: "Próxima página" }))
    expect(table.previousPage).toHaveBeenCalledOnce()
    expect(table.nextPage).toHaveBeenCalledOnce()

    await user.click(screen.getByRole("combobox", { name: "Linhas por página" }))
    await user.click(await screen.findByRole("option", { name: "10" }))
    expect(table.setPageSize).toHaveBeenCalledWith(10)
  })

  it("normaliza uma contagem de páginas vazia", () => {
    const table = createTable()
    table.getPageCount = () => 0

    render(<DataTablePagination table={table} rowCount={0} />)

    expect(screen.getByText("0 registros")).toBeInTheDocument()
    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument()
  })
})
