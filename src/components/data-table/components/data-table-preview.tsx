import { useMemo } from "react"

import { DataTable } from "@/components/data-table/components/data-table"
import { DataTablePagination } from "@/components/data-table/components/data-table-pagination"
import { DataTableRoot } from "@/components/data-table/components/data-table-root"
import {
  DataTableRowActions,
  DataTableRowActionsHeader,
} from "@/components/data-table/components/data-table-row-actions"
import { DataTableSearch } from "@/components/data-table/components/data-table-search"
import {
  DataTableEmpty,
} from "@/components/data-table/components/data-table-state"
import { DataTableToolbar } from "@/components/data-table/components/data-table-toolbar"
import { DataTableViewOptions } from "@/components/data-table/components/data-table-view-options"
import { createDataTableHook } from "@/components/data-table/hooks/create-data-table-hook"
import { useDataTableState } from "@/components/data-table/hooks/use-data-table-state"
import { dataTableCopy } from "@/components/data-table/data-table.copy"
import { copyToClipboard } from "@/lib/copy-to-clipboard"

interface PreviewRecord {
  id: string
}

export interface DataTablePreviewProps {
  caption: string
  idPrefix: string
  itemLabel: {
    singular: string
    plural: string
  }
}

const PREVIEW_RECORD_COUNT = 28
const tableApi = createDataTableHook<Record<string, never>>()
const columnHelper = tableApi.createAppColumnHelper<PreviewRecord>()

function copyPreviewRecord(record: PreviewRecord) {
  void copyToClipboard({
    errorDescription: dataTableCopy.rowActions.copyErrorDescription,
    successDescription: dataTableCopy.rowActions.copySuccessDescription,
    successTitle: dataTableCopy.rowActions.copySuccessTitle,
    value: `ID: ${record.id}`,
  })
}

const columns = columnHelper.columns([
  columnHelper.accessor("id", {
    cell: ({ getValue }) => getValue(),
    enableHiding: true,
    header: "ID",
    meta: { visibilityLabel: "ID" },
  }),
  columnHelper.display({
    cell: ({ row }) => (
      <DataTableRowActions
        accessibleLabel={`Ações do ID ${row.original.id}`}
        onCopyData={() => copyPreviewRecord(row.original)}
      />
    ),
    enableHiding: false,
    header: DataTableRowActionsHeader,
    id: "actions",
  }),
])

export function DataTablePreview({
  caption,
  idPrefix,
  itemLabel,
}: DataTablePreviewProps) {
  const state = useDataTableState()
  const records = useMemo(
    () =>
      Array.from({ length: PREVIEW_RECORD_COUNT }, (_, index) => ({
        id: `${idPrefix}-${String(index + 1).padStart(3, "0")}`,
      })),
    [idPrefix],
  )
  const filteredRecords = useMemo(() => {
    const normalizedSearch = state.globalFilter.toLocaleLowerCase("pt-BR")

    return normalizedSearch
      ? records.filter((record) =>
          record.id.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
        )
      : records
  }, [records, state.globalFilter])
  const paginatedRecords = useMemo(() => {
    const start = state.pagination.pageIndex * state.pagination.pageSize
    return filteredRecords.slice(start, start + state.pagination.pageSize)
  }, [filteredRecords, state.pagination.pageIndex, state.pagination.pageSize])
  const table = tableApi.useAppTable({
    columns,
    data: paginatedRecords,
    getRowId: (record) => record.id,
    onColumnVisibilityChange: state.setColumnVisibility,
    onPaginationChange: state.onPaginationChange,
    rowCount: filteredRecords.length,
    state: {
      columnVisibility: state.columnVisibility,
      pagination: state.pagination,
    },
  })

  return (
    <DataTableRoot isBusy={false}>
      <DataTableToolbar
        actions={<DataTableViewOptions table={table} />}
        activeFilterCount={
          state.columnFilters.length + Number(Boolean(state.searchDraft.trim()))
        }
        onClearFilters={state.clearFilters}
      >
        <DataTableSearch
          onChange={state.handleSearchChange}
          onClear={state.clearSearch}
          onSubmit={state.submitSearch}
          value={state.searchDraft}
        />
      </DataTableToolbar>

      <DataTable
        caption={caption}
        emptyState={
          <DataTableEmpty
            hasFilters={state.hasFilters}
            onClearFilters={state.clearFilters}
          />
        }
        isInitialLoading={false}
        table={table}
      />

      <DataTablePagination
        itemLabel={itemLabel}
        rowCount={filteredRecords.length}
        table={table}
      />
    </DataTableRoot>
  )
}
