import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react"
import type { PaginationState } from "@tanstack/react-table"

import { dataTableCopy } from "@/components/data-table/data-table.copy"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaginatedTable {
  state: { pagination: PaginationState }
  getPageCount: () => number
  getCanPreviousPage: () => boolean
  getCanNextPage: () => boolean
  firstPage: () => void
  lastPage: () => void
  previousPage: () => void
  nextPage: () => void
  setPageSize: (size: number) => void
}

interface DataTablePaginationProps {
  itemLabel?: { singular: string; plural: string }
  rowCount: number
  table: PaginatedTable
}

const pageSizes = [10, 20, 50, 100].map((size) => ({ label: String(size), value: String(size) }))

export function DataTablePagination({ itemLabel = dataTableCopy.pagination.defaultItem, rowCount, table }: DataTablePaginationProps) {
  const { pageIndex, pageSize } = table.state.pagination
  const pageCount = Math.max(table.getPageCount(), 1)
  return (
    <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left" data-slot="data-table-pagination">
      <p className="text-sm text-muted-foreground">{rowCount} {rowCount === 1 ? itemLabel.singular : itemLabel.plural}</p>
      <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap md:w-auto md:justify-end">
        <div className="flex items-center justify-center gap-2" data-slot="data-table-page-size">
          <span className="text-sm text-muted-foreground">{dataTableCopy.pagination.rowsPerPage}</span>
          <Select items={pageSizes} onValueChange={(value) => table.setPageSize(Number(value))} value={String(pageSize)}>
            <SelectTrigger aria-label={dataTableCopy.pagination.rowsPerPage} size="sm"><SelectValue /></SelectTrigger>
            <SelectContent align="end"><SelectGroup>{pageSizes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center gap-2" data-slot="data-table-page-navigation">
          <span className="min-w-24 text-center text-sm">{dataTableCopy.pagination.page} {pageIndex + 1} {dataTableCopy.pagination.of} {pageCount}</span>
          <div className="flex items-center gap-1">
            <Button aria-label={dataTableCopy.pagination.first} data-testid="data-table-page-first" disabled={!table.getCanPreviousPage()} onClick={() => table.firstPage()} size="icon-sm" variant="outline"><ChevronsLeftIcon aria-hidden="true" /></Button>
            <Button aria-label={dataTableCopy.pagination.previous} data-testid="data-table-page-previous" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} size="icon-sm" variant="outline"><ChevronLeftIcon aria-hidden="true" /></Button>
            <Button aria-label={dataTableCopy.pagination.next} data-testid="data-table-page-next" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} size="icon-sm" variant="outline"><ChevronRightIcon aria-hidden="true" /></Button>
            <Button aria-label={dataTableCopy.pagination.last} data-testid="data-table-page-last" disabled={!table.getCanNextPage()} onClick={() => table.lastPage()} size="icon-sm" variant="outline"><ChevronsRightIcon aria-hidden="true" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
