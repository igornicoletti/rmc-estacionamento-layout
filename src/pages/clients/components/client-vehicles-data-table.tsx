import { useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableComboboxFilter } from "@/components/data-table/data-table-combobox-filter"
import { DataTableExport } from "@/components/data-table/data-table-export"
import { useDataTable } from "@/components/data-table/data-table-features"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableRoot } from "@/components/data-table/data-table-root"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { DataTableEmpty, DataTableError, DataTableUpdating } from "@/components/data-table/data-table-state"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { downloadCsv, serializeCsv } from "@/lib/export-to-csv"
import { serializeRecordForClipboard } from "@/lib/format-record-fields"
import { clientsCopy } from "@/pages/clients/clients.copy"
import { createClientVehiclesTableColumns } from "@/pages/clients/components/client-vehicles-table-columns"
import { clientPreviewQueryKeys, loadPreviewClientVehicles } from "@/pages/clients/data/client-preview-data"
import type { ClientVehicle } from "@/pages/clients/model/client-vehicle"
import { formatVehicleDescription } from "@/pages/clients/model/client-presentation"
import { clientVehicleRecordCsvColumns, clientVehicleRecordSections } from "@/pages/clients/model/client-vehicle-record-presentation"

const EMPTY_VEHICLES: ClientVehicle[] = []

export function ClientVehiclesDataTable({ clientId }: { clientId: string }) {
  const query = useQuery({ queryKey: clientPreviewQueryKeys.vehicles, queryFn: loadPreviewClientVehicles, staleTime: Number.POSITIVE_INFINITY })
  const allVehicles = query.data ?? EMPTY_VEHICLES
  const vehicles = useMemo(() => allVehicles.filter((vehicle) => vehicle.clientId === clientId), [allVehicles, clientId])
  const showDriver = useMemo(() => vehicles.some((vehicle) => vehicle.driverName !== ""), [vehicles])
  const copyVehicle = useCallback((vehicle: ClientVehicle) => copyToClipboard(serializeRecordForClipboard(vehicle, clientVehicleRecordSections)), [])
  const columns = useMemo(() => createClientVehiclesTableColumns(showDriver, { onCopyData: copyVehicle }), [copyVehicle, showDriver])

  const table = useDataTable({
    columns,
    data: vehicles,
    getRowId: (vehicle) => vehicle.id,
    initialState: {
      columnVisibility: {
        clientActiveWithin120Days: false, clientId: false, clientName: false,
        clientTaxId: false, clientTradeName: false,
      },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  })

  const descriptionColumn = table.getColumn("description")
  const descriptionValue = descriptionColumn?.getFilterValue() as string | undefined
  const descriptionCounts = new Map<string, number>(descriptionColumn?.getFacetedUniqueValues() as Map<string, number> | undefined)
  const descriptionItems = Array.from(new Set(vehicles.map((vehicle) => vehicle.description).filter(Boolean)))
    .map((value) => ({ label: formatVehicleDescription(value), value }))
    .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"))

  const search = String(table.state.globalFilter ?? "")
  const activeFilterCount = Number(Boolean(search.trim())) + table.state.columnFilters.length
  const clearFilters = () => {
    table.setGlobalFilter("")
    table.resetColumnFilters()
  }
  const exportRows = table.getPrePaginatedRowModel().rows.map((row) => row.original)

  if (query.isError) {
    return <DataTableError description={clientsCopy.vehicles.loadError} onRetry={() => void query.refetch()} />
  }

  return (
    <DataTableRoot isBusy={query.isPending || query.isFetching}>
      <DataTableToolbar
        actions={<><DataTableExport disabled={exportRows.length === 0} onExport={() => downloadCsv(`veiculos-cliente-${clientId}.csv`, serializeCsv(exportRows, clientVehicleRecordCsvColumns))} /><DataTableViewOptions table={table} /></>}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      >
        <DataTableSearch
          ariaLabel={clientsCopy.vehicles.searchAriaLabel}
          onChange={table.setGlobalFilter}
          onClear={() => table.setGlobalFilter("")}
          placeholder={showDriver ? clientsCopy.vehicles.searchWithDriverPlaceholder : clientsCopy.vehicles.searchWithoutDriverPlaceholder}
          value={search}
        />
        {descriptionItems.length > 1 ? (
          <DataTableComboboxFilter
            ariaLabel={clientsCopy.vehicles.filterAriaLabel}
            clearAriaLabel={clientsCopy.vehicles.filterClearAriaLabel}
            counts={descriptionCounts}
            items={descriptionItems}
            onValueChange={(value) => descriptionColumn?.setFilterValue(value)}
            placeholder={clientsCopy.vehicles.filterPlaceholder}
            value={descriptionValue}
          />
        ) : null}
      </DataTableToolbar>
      <DataTableUpdating active={query.isFetching && !query.isPending} />
      <DataTable
        caption={clientsCopy.vehicles.caption}
        emptyState={<DataTableEmpty emptyDescription={clientsCopy.vehicles.emptyDescription} emptyTitle={clientsCopy.vehicles.emptyTitle} hasFilters={activeFilterCount > 0} onClearFilters={clearFilters} />}
        isInitialLoading={query.isPending}
        table={table}
      />
      {!query.isPending ? <DataTablePagination itemLabel={clientsCopy.vehicles.itemLabel} rowCount={table.getPrePaginatedRowModel().rows.length} table={table} /> : null}
    </DataTableRoot>
  )
}
