import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { AppRecordDetails } from "@/components/common/app-record-details"
import { AppSheet } from "@/components/common/app-sheet"
import { DataTable } from "@/components/data-table/components/data-table"
import { DataTableComboboxFilter } from "@/components/data-table/components/data-table-combobox-filter"
import { DataTableExport } from "@/components/data-table/components/data-table-export"
import { DataTablePagination } from "@/components/data-table/components/data-table-pagination"
import { DataTableRoot } from "@/components/data-table/components/data-table-root"
import { DataTableSearch } from "@/components/data-table/components/data-table-search"
import {
  DataTableEmpty,
  DataTableError,
} from "@/components/data-table/components/data-table-state"
import { DataTableToolbar } from "@/components/data-table/components/data-table-toolbar"
import { DataTableViewOptions } from "@/components/data-table/components/data-table-view-options"
import {
  normalizeSearchText,
  paginateRows,
  sortRows,
} from "@/components/data-table/core/table-data-utils"
import { useDataTableState } from "@/components/data-table/hooks/use-data-table-state"
import { dataTableCopy } from "@/components/data-table/data-table.copy"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { downloadCsv, serializeCsv } from "@/lib/export-to-csv"
import { serializeRecordForClipboard } from "@/lib/format-record-fields"
import { clientsCopy } from "@/pages/clients/clients.copy"
import {
  clientVehiclesTableApi,
  createClientVehiclesTableColumns,
} from "@/pages/clients/components/client-vehicles-table-columns"
import {
  clientPreviewQueryKeys,
  loadPreviewClientVehicles,
} from "@/pages/clients/data/client-preview-data"
import type { ClientVehicle } from "@/pages/clients/model/client-vehicle"
import {
  clientVehicleRecordCsvColumns,
  clientVehicleRecordSections,
} from "@/pages/clients/model/client-vehicle-record-presentation"
import {
  formatErpName,
  formatLicensePlate,
  formatVehicleDescription,
} from "@/pages/clients/model/client-presentation"

interface ClientVehiclesDataTableProps {
  clientId: string
}

const EMPTY_CLIENT_VEHICLES: ClientVehicle[] = []

export function ClientVehiclesDataTable({
  clientId,
}: ClientVehiclesDataTableProps) {
  const vehiclesQuery = useQuery({
    queryKey: clientPreviewQueryKeys.vehicles,
    queryFn: loadPreviewClientVehicles,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const allVehicles = vehiclesQuery.data ?? EMPTY_CLIENT_VEHICLES
  const [descriptionFilter, setDescriptionFilter] = useState<string>()
  const [selectedVehicle, setSelectedVehicle] =
    useState<ClientVehicle | null>(null)
  const state = useDataTableState({
    initialColumnVisibility: {
      clientActiveWithin120Days: false,
      clientId: false,
      clientName: false,
      clientTaxId: false,
      clientTradeName: false,
    },
  })

  const handleCopyData = useCallback((vehicle: ClientVehicle) => {
    void copyToClipboard({
      errorDescription: dataTableCopy.rowActions.copyErrorDescription,
      successDescription: dataTableCopy.rowActions.copySuccessDescription,
      successTitle: dataTableCopy.rowActions.copySuccessTitle,
      value: serializeRecordForClipboard(
        vehicle,
        clientVehicleRecordSections,
      ),
    })
  }, [])

  const clientVehicles = useMemo(
    () => allVehicles.filter((vehicle) => vehicle.clientId === clientId),
    [allVehicles, clientId],
  )
  const showDriver = useMemo(
    () => clientVehicles.some((vehicle) => vehicle.driverName !== ""),
    [clientVehicles],
  )
  const columns = useMemo(
    () =>
      createClientVehiclesTableColumns(showDriver, {
        onCopyData: handleCopyData,
        onDetails: setSelectedVehicle,
      }),
    [handleCopyData, showDriver],
  )

  const descriptionFacet = useMemo(() => {
    const descriptions = new Set<string>()
    const counts: Record<string, number> = {}

    for (const vehicle of clientVehicles) {
      if (vehicle.description === "") {
        continue
      }

      const value = formatVehicleDescription(vehicle.description)
      descriptions.add(value)
      counts[value] = (counts[value] ?? 0) + 1
    }

    return {
      counts,
      items: Array.from(descriptions)
        .sort((left, right) => left.localeCompare(right, "pt-BR"))
        .map((value) => ({ label: value, value })),
    }
  }, [clientVehicles])

  const handleDescriptionFilterChange = (value: string | undefined) => {
    setDescriptionFilter(value)
    state.onPaginationChange((current) => ({ ...current, pageIndex: 0 }))
  }

  const clearFilters = () => {
    state.clearFilters()
    setDescriptionFilter(undefined)
  }

  const filteredVehicles = useMemo(() => {
    const search = normalizeSearchText(state.globalFilter)

    return clientVehicles.filter((vehicle) => {
      if (
        descriptionFilter &&
        formatVehicleDescription(vehicle.description) !== descriptionFilter
      ) {
        return false
      }

      if (!search) {
        return true
      }

      return normalizeSearchText(
        [
          vehicle.id,
          vehicle.plate,
          formatLicensePlate(vehicle.plate),
          vehicle.description,
          formatVehicleDescription(vehicle.description),
          showDriver ? vehicle.driverName : "",
          showDriver ? formatErpName(vehicle.driverName) : "",
        ].join(" "),
      ).includes(search)
    })
  }, [
    clientVehicles,
    descriptionFilter,
    showDriver,
    state.globalFilter,
  ])

  const sortedVehicles = useMemo(
    () =>
      sortRows(filteredVehicles, state.sorting, (vehicle, columnId) => {
        if (columnId === "description") {
          return formatVehicleDescription(vehicle.description)
        }

        if (columnId === "plate") {
          return formatLicensePlate(vehicle.plate)
        }

        if (columnId === "driverName") {
          return formatErpName(vehicle.driverName)
        }

        return vehicle[columnId as keyof ClientVehicle]
      }),
    [filteredVehicles, state.sorting],
  )

  const paginatedVehicles = useMemo(
    () => paginateRows(sortedVehicles, state.pagination),
    [sortedVehicles, state.pagination],
  )

  const table = clientVehiclesTableApi.useAppTable({
    columns,
    data: paginatedVehicles,
    getRowId: (vehicle) => vehicle.id,
    onColumnVisibilityChange: state.setColumnVisibility,
    onPaginationChange: state.onPaginationChange,
    onSortingChange: state.onSortingChange,
    rowCount: filteredVehicles.length,
    state: {
      columnVisibility: state.columnVisibility,
      pagination: state.pagination,
      sorting: state.sorting,
    },
  })

  const hasActiveFilters = state.hasFilters || Boolean(descriptionFilter)

  if (vehiclesQuery.isError) {
    return (
      <DataTableError
        description={clientsCopy.vehicles.loadError}
        onRetry={() => void vehiclesQuery.refetch()}
      />
    )
  }

  return (
    <>
      <DataTableRoot
        isBusy={vehiclesQuery.isPending || vehiclesQuery.isFetching}
      >
        <DataTableToolbar
          actions={
            <>
              <DataTableExport
                disabled={sortedVehicles.length === 0}
                onExport={() =>
                  downloadCsv(
                    `veiculos-cliente-${clientId}.csv`,
                    serializeCsv(
                      sortedVehicles,
                      clientVehicleRecordCsvColumns,
                    ),
                  )
                }
              />
              <DataTableViewOptions table={table} />
            </>
          }
          activeFilterCount={
            Number(Boolean(state.searchDraft.trim())) +
            Number(Boolean(descriptionFilter))
          }
          onClearFilters={clearFilters}
        >
          <DataTableSearch
            ariaLabel={clientsCopy.vehicles.searchAriaLabel}
            onChange={state.handleSearchChange}
            onClear={state.clearSearch}
            onSubmit={state.submitSearch}
            placeholder={
              showDriver
                ? clientsCopy.vehicles.searchWithDriverPlaceholder
                : clientsCopy.vehicles.searchWithoutDriverPlaceholder
            }
            value={state.searchDraft}
          />
          {descriptionFacet.items.length > 1 ? (
            <DataTableComboboxFilter
              ariaLabel={clientsCopy.vehicles.filterAriaLabel}
              clearAriaLabel={clientsCopy.vehicles.filterClearAriaLabel}
              counts={descriptionFacet.counts}
              items={descriptionFacet.items}
              onValueChange={handleDescriptionFilterChange}
              placeholder={clientsCopy.vehicles.filterPlaceholder}
              value={descriptionFilter}
            />
          ) : null}
        </DataTableToolbar>

        <DataTable
          caption={clientsCopy.vehicles.caption}
          emptyState={
            <DataTableEmpty
              emptyDescription={clientsCopy.vehicles.emptyDescription}
              emptyTitle={clientsCopy.vehicles.emptyTitle}
              hasFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          }
          isInitialLoading={vehiclesQuery.isPending}
          table={table}
        />

        {!vehiclesQuery.isPending ? (
          <DataTablePagination
            itemLabel={clientsCopy.vehicles.itemLabel}
            rowCount={filteredVehicles.length}
            table={table}
          />
        ) : null}
      </DataTableRoot>

      {selectedVehicle ? (
        <AppSheet
          description={
            selectedVehicle.description
              ? formatVehicleDescription(selectedVehicle.description)
              : `Código ${selectedVehicle.id}`
          }
          onOpenChange={(open) => {
            if (!open) setSelectedVehicle(null)
          }}
          open
          title={formatLicensePlate(selectedVehicle.plate)}
        >
          <AppRecordDetails
            record={selectedVehicle}
            sections={clientVehicleRecordSections}
          />
        </AppSheet>
      ) : null}
    </>
  )
}
