import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableComboboxFilter } from "@/components/data-table/data-table-combobox-filter"
import { DataTableExport } from "@/components/data-table/data-table-export"
import { createDataTableColumnHelper, useDataTable } from "@/components/data-table/data-table-features"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableRoot } from "@/components/data-table/data-table-root"
import { DataTableRowActions, DataTableRowActionsHeader } from "@/components/data-table/data-table-row-actions"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { DataTableEmpty, DataTableError, DataTableUpdating } from "@/components/data-table/data-table-state"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"

interface RecordRow { id: string; name: string; city: string }

const records: RecordRow[] = [
  { id: "01", name: "Álvaro", city: "São Paulo" },
  { id: "02", name: "Bruna", city: "Curitiba" },
  ...Array.from({ length: 11 }, (_, index) => ({ id: String(index + 3).padStart(2, "0"), name: `Cliente ${index + 3}`, city: "São Paulo" })),
]
const onCopy = vi.fn<(id: string) => Promise<void>>(async () => {})
const onExport = vi.fn<(ids: string[]) => void>()
const columnHelper = createDataTableColumnHelper<RecordRow>()
const columns = columnHelper.columns([
  columnHelper.accessor("id", { header: "Código", meta: { visibilityLabel: "Código" }, enableGlobalFilter: false }),
  columnHelper.accessor("name", { header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />, meta: { visibilityLabel: "Nome" } }),
  columnHelper.accessor("city", { header: "Cidade", filterFn: "equals", meta: { visibilityLabel: "Cidade" }, enableGlobalFilter: false }),
  columnHelper.display({ id: "actions", header: DataTableRowActionsHeader, enableHiding: false, cell: ({ row }) => <DataTableRowActions accessibleLabel={`Ações de ${row.original.name}`} onCopyData={() => onCopy(row.original.id)} /> }),
])

function ExampleTable({ loading = false, updating = false, data = records }: { loading?: boolean; updating?: boolean; data?: RecordRow[] }) {
  const table = useDataTable({ columns, data, getRowId: (row) => row.id, initialState: { pagination: { pageIndex: 0, pageSize: 10 } } })
  const city = table.getColumn("city")
  const search = String(table.state.globalFilter ?? "")
  const selectedCity = city?.getFilterValue() as string | undefined
  const counts = new Map<string, number>(city?.getFacetedUniqueValues() as Map<string, number>)
  const clear = () => { table.setGlobalFilter(""); table.resetColumnFilters() }
  const activeCount = Number(Boolean(search)) + table.state.columnFilters.length
  return (
    <DataTableRoot isBusy={loading || updating}>
      <DataTableToolbar
        actions={<><DataTableExport disabled={table.getPrePaginatedRowModel().rows.length === 0} onExport={() => onExport(table.getPrePaginatedRowModel().rows.map((row) => row.original.id))} /><DataTableViewOptions table={table} /></>}
        activeFilterCount={activeCount}
        onClearFilters={clear}
      >
        <DataTableSearch onChange={table.setGlobalFilter} onClear={() => table.setGlobalFilter("")} value={search} />
        <DataTableComboboxFilter ariaLabel="Filtrar cidade" counts={counts} items={[{ label: "Curitiba", value: "Curitiba" }, { label: "São Paulo", value: "São Paulo" }]} onValueChange={(value) => city?.setFilterValue(value)} placeholder="Cidade" value={selectedCity} />
      </DataTableToolbar>
      <DataTableUpdating active={updating} />
      <DataTable caption="Registros de exemplo" emptyState={<DataTableEmpty hasFilters={activeCount > 0} onClearFilters={clear} />} isInitialLoading={loading} table={table} />
      {!loading ? <DataTablePagination rowCount={table.getPrePaginatedRowModel().rows.length} table={table} /> : null}
    </DataTableRoot>
  )
}

describe("Data Table", () => {
  it("renderiza tabela nativa, caption e primeira página", () => {
    render(<ExampleTable />)
    const table = screen.getByRole("table", { name: /Registros de exemplo/ })
    expect(within(table).getAllByRole("row")).toHaveLength(11)
    expect(screen.getByText("13 registros")).toBeInTheDocument()
  })

  it("busca imediatamente ignorando acentos e permite limpar", async () => {
    const user = userEvent.setup()
    render(<ExampleTable />)
    await user.type(screen.getByRole("searchbox"), "alvaro")
    expect(screen.getByRole("row", { name: /Álvaro/ })).toBeInTheDocument()
    expect(screen.queryByRole("row", { name: /Bruna/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Limpar busca" }))
    expect(screen.getByRole("row", { name: /Bruna/ })).toBeInTheDocument()
  })

  it("volta à primeira página quando o filtro reduz os resultados", async () => {
    const user = userEvent.setup()
    render(<ExampleTable />)
    await user.click(screen.getByRole("button", { name: "Próxima página" }))
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument()
    await user.type(screen.getByRole("searchbox"), "Bruna")
    expect(screen.getByRole("row", { name: /Bruna/ })).toBeInTheDocument()
    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument()
  })

  it("ordena com aria-sort e exporta todas as linhas antes da paginação", async () => {
    const user = userEvent.setup()
    onExport.mockClear()
    render(<ExampleTable />)
    const header = screen.getByRole("columnheader", { name: /Nome/ })
    await user.click(within(header).getByRole("button"))
    expect(header).toHaveAttribute("aria-sort", "ascending")
    await user.click(within(header).getByRole("button"))
    expect(header).toHaveAttribute("aria-sort", "descending")
    await user.click(screen.getByRole("button", { name: "Exportar CSV" }))
    expect(onExport).toHaveBeenCalledOnce()
    expect(onExport.mock.calls[0]?.[0]).toHaveLength(13)
  })

  it("filtra a faceta, atualiza as contagens e limpa os filtros", async () => {
    const user = userEvent.setup()
    render(<ExampleTable />)
    const city = screen.getByRole("combobox", { name: "Filtrar cidade" })
    await user.type(city, "Curitiba")
    await user.click(await screen.findByRole("option", { name: /Curitiba/ }))
    expect(screen.getByText("1 registro")).toBeInTheDocument()
    expect(screen.getByRole("row", { name: /Bruna/ })).toBeInTheDocument()
    await user.type(screen.getByRole("searchbox"), "sem resultado")
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument()
    await user.click(within(screen.getByRole("status")).getByRole("button", { name: "Limpar filtros" }))
    expect(screen.getByText("13 registros")).toBeInTheDocument()
  })

  it("pagina, altera tamanho e controla visibilidade", async () => {
    const user = userEvent.setup()
    render(<ExampleTable />)
    await user.click(screen.getByRole("button", { name: "Próxima página" }))
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Página anterior" }))
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Última página" }))
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Primeira página" }))
    await user.click(screen.getByRole("combobox", { name: "Linhas por página" }))
    await user.click(await screen.findByRole("option", { name: "20" }))
    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Gerenciar colunas" }))
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Código" }))
    expect(screen.queryByRole("columnheader", { name: "Código" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Cidade" }))
    expect(screen.getByRole("menuitemcheckbox", { name: /Nome, última coluna visível/ })).toHaveAttribute("aria-disabled", "true")
  })

  it("apresenta loading, estado vazio, erro e atualização", async () => {
    const { rerender } = render(<ExampleTable loading />)
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.queryByText("Nenhum registro disponível")).not.toBeInTheDocument()
    rerender(<ExampleTable data={[]} />)
    expect(screen.getByText("Nenhum registro disponível")).toBeInTheDocument()
    rerender(<><DataTableError onRetry={vi.fn()} /><ExampleTable updating /></>)
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument()
    expect(await screen.findByText("Atualizando")).toBeInTheDocument()
  })

  it("oferece ação de cópia por linha", async () => {
    const user = userEvent.setup()
    onCopy.mockClear()
    render(<ExampleTable />)
    await user.click(screen.getByRole("button", { name: "Ações de Álvaro" }))
    await user.click(await screen.findByRole("menuitem", { name: "Copiar dados" }))
    expect(onCopy).toHaveBeenCalledWith("01")
  })

  it("mantém a tabela utilizável quando a cópia falha", async () => {
    const user = userEvent.setup()
    onCopy.mockRejectedValueOnce(new Error("clipboard indisponível"))
    render(<ExampleTable />)
    await user.click(screen.getByRole("button", { name: "Ações de Álvaro" }))
    await user.click(await screen.findByRole("menuitem", { name: "Copiar dados" }))
    expect(screen.getByRole("table")).toBeInTheDocument()
  })
})
