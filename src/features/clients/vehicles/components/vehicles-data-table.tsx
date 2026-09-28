import { useCallback, useEffect, useMemo, useRef } from "react"
import { useQuery } from "@tanstack/react-query"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableActions } from "@/components/data-table/data-table-actions"
import { DataTableComboboxFilter } from "@/components/data-table/data-table-combobox-filter"
import { useDataTable } from "@/components/data-table/data-table-features"
import { dataTableNotify } from "@/components/data-table/data-table-notify"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableRoot } from "@/components/data-table/data-table-root"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import {
  DataTableEmpty,
  DataTableError,
  DataTableUpdating,
} from "@/components/data-table/data-table-state"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { notify } from "@/components/toast/toast-notify"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { serializeRecordForClipboard } from "@/lib/format-record-fields"
import { createVehiclesTableColumns } from "@/features/clients/vehicles/components/vehicles-table-columns"
import { vehiclesContent } from "@/features/clients/vehicles/content/vehicles-content"
import type { ClientVehicle } from "@/features/clients/vehicles/contracts/vehicles-types"
import { formatVehicleDescription } from "@/features/clients/vehicles/presentation/vehicles-format"
import {
  clientVehicleRecordCsvColumns,
  clientVehicleRecordSections,
} from "@/features/clients/vehicles/presentation/vehicles-record"
import {
  loadDemoVehicles,
  vehiclesQueryKeys,
} from "@/features/clients/vehicles/queries/vehicles-query"

const EMPTY_VEHICLES: ClientVehicle[] = []

export function VehiclesDataTable({ clientId }: { clientId: string }) {
  const query = useQuery({
    queryKey: vehiclesQueryKeys.vehicles,
    queryFn: loadDemoVehicles,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const isInitialPending = query.isPending
  const notifiedRefetchErrorAt = useRef(query.errorUpdatedAt)

  useEffect(() => {
    if (
      !query.isRefetchError ||
      query.errorUpdatedAt === 0 ||
      query.errorUpdatedAt === notifiedRefetchErrorAt.current
    ) {
      return
    }

    notifiedRefetchErrorAt.current = query.errorUpdatedAt
    notify(dataTableNotify.refreshFailed)
  }, [query.errorUpdatedAt, query.isRefetchError])

  const allVehicles = query.data ?? EMPTY_VEHICLES
  const vehicles = useMemo(
    () => allVehicles.filter((vehicle) => vehicle.clientId === clientId),
    [allVehicles, clientId],
  )
  const showDriver = useMemo(
    () => vehicles.some((vehicle) => vehicle.driverName !== ""),
    [vehicles],
  )
  const copyVehicle = useCallback(
    (vehicle: ClientVehicle) =>
      copyToClipboard(
        serializeRecordForClipboard(vehicle, clientVehicleRecordSections),
      ),
    [],
  )
  const columns = useMemo(
    () => createVehiclesTableColumns(showDriver, { onCopyData: copyVehicle }),
    [copyVehicle, showDriver],
  )

  const table = useDataTable({
    columns,
    data: vehicles,
    getRowId: (vehicle) => vehicle.id,
    initialState: {
      columnVisibility: {
        clientId: false,
        clientName: false,
        clientTaxId: false,
        clientTradeName: false,
      },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  })

  const descriptionColumn = table.getColumn("description")
  const descriptionValue = descriptionColumn?.getFilterValue() as
    | string
    | undefined
  const descriptionCounts = new Map<string, number>(
    descriptionColumn?.getFacetedUniqueValues() as
      | Map<string, number>
      | undefined,
  )
  const descriptionItems = Array.from(
    new Set(vehicles.map((vehicle) => vehicle.description).filter(Boolean)),
  )
    .map((value) => ({ label: formatVehicleDescription(value), value }))
    .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"))

  const search = String(table.state.globalFilter ?? "")
  const activeFilterCount =
    Number(Boolean(search.trim())) + table.state.columnFilters.length
  const rowCount = table.getPrePaginatedRowModel().rows.length
  const clearFilters = () => {
    table.setGlobalFilter("")
    table.resetColumnFilters()
  }

  if (query.isLoadingError) {
    return (
      <DataTableError
        description={vehiclesContent.loadError}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <DataTableRoot isBusy={query.isFetching}>
      <DataTableToolbar
        actions={
          <DataTableActions
            csvColumns={clientVehicleRecordCsvColumns}
            filename={`veiculos-cliente-${clientId}.csv`}
            isBusy={isInitialPending}
            table={table}
          />
        }
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      >
        <DataTableSearch
          ariaLabel={vehiclesContent.searchAriaLabel}
          disabled={isInitialPending}
          onChange={table.setGlobalFilter}
          onClear={() => table.setGlobalFilter("")}
          placeholder={
            showDriver
              ? vehiclesContent.searchWithDriverPlaceholder
              : vehiclesContent.searchWithoutDriverPlaceholder
          }
          value={search}
        />
        {descriptionItems.length > 1 ? (
          <DataTableComboboxFilter
            ariaLabel={vehiclesContent.filterAriaLabel}
            clearAriaLabel={vehiclesContent.filterClearAriaLabel}
            counts={descriptionCounts}
            disabled={isInitialPending}
            items={descriptionItems}
            onValueChange={(value) => descriptionColumn?.setFilterValue(value)}
            placeholder={vehiclesContent.filterPlaceholder}
            value={descriptionValue}
          />
        ) : null}
      </DataTableToolbar>
      <DataTableUpdating active={query.isRefetching} />
      <DataTable
        caption={vehiclesContent.caption}
        emptyState={
          <DataTableEmpty
            emptyDescription={vehiclesContent.emptyDescription}
            emptyTitle={vehiclesContent.emptyTitle}
            hasFilters={activeFilterCount > 0}
            onClearFilters={clearFilters}
          />
        }
        isLoading={isInitialPending}
        table={table}
      />
      {!isInitialPending ? (
        <DataTablePagination
          itemLabel={vehiclesContent.itemLabel}
          rowCount={rowCount}
          table={table}
        />
      ) : null}
    </DataTableRoot>
  )
}
