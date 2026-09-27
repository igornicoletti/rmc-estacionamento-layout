import type { ReactNode } from "react"
import type { ReactTable, RowData } from "@tanstack/react-table"

import { DataTableSkeletonRows } from "@/components/data-table/data-table-state"
import type { DataTableFeatures } from "@/components/data-table/data-table-features"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataTableProps<TData extends RowData> {
  caption: string
  emptyState: ReactNode
  isInitialLoading: boolean
  skeletonRows?: number
  table: ReactTable<DataTableFeatures, TData>
}

export function DataTable<TData extends RowData>({ caption, emptyState, isInitialLoading, skeletonRows = 5, table }: DataTableProps<TData>) {
  const rows = table.getRowModel().rows
  const columnCount = Math.max(table.getVisibleLeafColumns().length, 1)
  const hasSorting = table.getAllLeafColumns().some((column) => column.getCanSort())

  return (
    <div className="overflow-hidden rounded-3xl border" data-slot="data-table">
      <Table>
        <TableCaption className="sr-only">
          {caption}{hasSorting ? ". Os cabeçalhos com botão permitem ordenar os resultados." : null}
        </TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const direction = header.column.getIsSorted()
                return (
                  <TableHead
                    aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined}
                    data-column-id={header.column.id}
                    key={header.id}
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isInitialLoading ? <DataTableSkeletonRows columns={columnCount} rows={skeletonRows} /> : rows.map((row) => (
            <TableRow data-row-id={row.id} data-testid="data-table-row" key={row.id}>
              {row.getVisibleCells().map((cell) => <TableCell key={cell.id}><table.FlexRender cell={cell} /></TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!isInitialLoading && rows.length === 0 ? (
        <><Separator /><div aria-live="polite" className="w-full min-w-0" role="status">{emptyState}</div></>
      ) : null}
    </div>
  )
}
