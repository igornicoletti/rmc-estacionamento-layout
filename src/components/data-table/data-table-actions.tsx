import { DataTableExport } from "@/components/data-table/data-table-export"
import {
  DataTableViewOptions,
  type DataTableViewOptionsProps,
} from "@/components/data-table/data-table-view-options"
import {
  downloadCsv,
  serializeCsv,
  type CsvColumn,
} from "@/lib/csv/csv-export"

interface DataTableActionsProps<TRow> {
  csvColumns: readonly CsvColumn<TRow>[]
  filename: string
  isBusy: boolean
  table: DataTableViewOptionsProps["table"] & {
    getPrePaginatedRowModel: () => { rows: { original: TRow }[] }
  }
}

// The shared contract exports all filtered/sorted rows, never only the current page.
export function DataTableActions<TRow>({
  csvColumns,
  filename,
  isBusy,
  table,
}: DataTableActionsProps<TRow>) {
  const rows = table.getPrePaginatedRowModel().rows
  return (
    <>
      <DataTableExport
        disabled={isBusy || rows.length === 0}
        onExport={() =>
          downloadCsv(
            filename,
            serializeCsv(
              table.getPrePaginatedRowModel().rows.map((row) => row.original),
              csvColumns,
            ),
          )
        }
      />
      <DataTableViewOptions table={table} />
    </>
  )
}
