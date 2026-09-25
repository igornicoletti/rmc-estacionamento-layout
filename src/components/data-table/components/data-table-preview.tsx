import { useMemo } from "react"

import { DataTable } from "@/components/data-table/components/data-table"
import { DataTablePagination } from "@/components/data-table/components/data-table-pagination"
import { DataTableRoot } from "@/components/data-table/components/data-table-root"
import {
  DataTableRowActions,
  DataTableRowActionsHeader,
} from "@/components/data-table/components/data-table-row-actions"
import { DataTableSearch } from "@/components/data-table/components/data-table-search"
import { DataTableEmpty } from "@/components/data-table/components/data-table-state"
import { DataTableToolbar } from "@/components/data-table/components/data-table-toolbar"
import { DataTableViewOptions } from "@/components/data-table/components/data-table-view-options"
import { createDataTableHook } from "@/components/data-table/hooks/create-data-table-hook"
import { useLocalDataTableModel } from "@/components/data-table/hooks/use-local-data-table-model"
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
  const records = useMemo(
    () =>
      Array.from({ length: PREVIEW_RECORD_COUNT }, (_, index) => ({
        id: `${idPrefix}-${String(index + 1).padStart(3, "0")}`,
      })),
    [idPrefix],
  )
  const model = useLocalDataTableModel({
    getSearchText: (record: PreviewRecord) => record.id,
    rows: records,
  })
  const table = tableApi.useAppTable({
    columns,
    data: model.pageRows,
    getRowId: (record) => record.id,
    onColumnVisibilityChange: model.state.setColumnVisibility,
    onPaginationChange: model.state.onPaginationChange,
    rowCount: model.filteredRows.length,
    state: {
      columnVisibility: model.state.columnVisibility,
      pagination: model.state.pagination,
    },
  })

  return (
    <DataTableRoot isBusy={false}>
      <DataTableToolbar
        actions={<DataTableViewOptions table={table} />}
        activeFilterCount={model.activeFilterCount}
        onClearFilters={model.clearFilters}
      >
        <DataTableSearch
          onChange={model.state.handleSearchChange}
          onClear={model.state.clearSearch}
          onSubmit={model.state.submitSearch}
          value={model.state.searchDraft}
        />
      </DataTableToolbar>

      <DataTable
        caption={caption}
        emptyState={
          <DataTableEmpty
            hasFilters={model.hasActiveFilters}
            onClearFilters={model.clearFilters}
          />
        }
        isInitialLoading={false}
        table={table}
      />

      <DataTablePagination
        itemLabel={itemLabel}
        rowCount={model.filteredRows.length}
        table={table}
      />
    </DataTableRoot>
  )
}
