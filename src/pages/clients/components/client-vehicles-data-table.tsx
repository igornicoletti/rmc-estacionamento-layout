import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { RecordDetails } from "@/components/record-details/record-details"
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
  DataTableUpdating,
} from "@/components/data-table/components/data-table-state"
import { DataTableToolbar } from "@/components/data-table/components/data-table-toolbar"
import { DataTableViewOptions } from "@/components/data-table/components/data-table-view-options"
import { useLocalDataTableModel } from "@/components/data-table/hooks/use-local-data-table-model"
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

function getVehicleDescriptionValue(vehicle: ClientVehicle) {
  return vehicle.description
    ? formatVehicleDescription(vehicle.description)
    : undefined
}

function getVehicleDescriptionLabel(vehicle: ClientVehicle) {
  return formatVehicleDescription(vehicle.description)
}

function getVehicleSearchText(vehicle: ClientVehicle) {
  return [
    vehicle.id,
    vehicle.plate,
    formatLicensePlate(vehicle.plate),
    vehicle.description,
    formatVehicleDescription(vehicle.description),
    vehicle.driverName,
    formatErpName(vehicle.driverName),
  ].join(" ")
}

function getVehicleSortValue(vehicle: ClientVehicle, columnId: string) {
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
}

export function ClientVehiclesDataTable({
  clientId,
}: ClientVehiclesDataTableProps) {
  const vehiclesQuery = useQuery({
    queryKey: clientPreviewQueryKeys.vehicles,
    queryFn: loadPreviewClientVehicles,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const allVehicles = vehiclesQuery.data ?? EMPTY_CLIENT_VEHICLES
  const [selectedVehicle, setSelectedVehicle] =
    useState<ClientVehicle | null>(null)
  const clientVehicles = useMemo(
    () => allVehicles.filter((vehicle) => vehicle.clientId === clientId),
    [allVehicles, clientId],
  )
  const showDriver = useMemo(
    () => clientVehicles.some((vehicle) => vehicle.driverName !== ""),
    [clientVehicles],
  )
  const model = useLocalDataTableModel({
    getFacetLabel: getVehicleDescriptionLabel,
    getFacetValue: getVehicleDescriptionValue,
    getSearchText: getVehicleSearchText,
    getSortValue: getVehicleSortValue,
    initialColumnVisibility: {
      clientActiveWithin120Days: false,
      clientId: false,
      clientName: false,
      clientTaxId: false,
      clientTradeName: false,
    },
    rows: clientVehicles,
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

  const columns = useMemo(
    () =>
      createClientVehiclesTableColumns(showDriver, {
        onCopyData: handleCopyData,
        onDetails: setSelectedVehicle,
      }),
    [handleCopyData, showDriver],
  )

  const table = clientVehiclesTableApi.useAppTable({
    columns,
    data: model.pageRows,
    getRowId: (vehicle) => vehicle.id,
    onColumnVisibilityChange: model.state.setColumnVisibility,
    onPaginationChange: model.state.onPaginationChange,
    onSortingChange: model.state.onSortingChange,
    rowCount: model.filteredRows.length,
    state: {
      columnVisibility: model.state.columnVisibility,
      pagination: model.state.pagination,
      sorting: model.state.sorting,
    },
  })

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
                disabled={model.sortedRows.length === 0}
                onExport={() =>
                  downloadCsv(
                    `veiculos-cliente-${clientId}.csv`,
                    serializeCsv(
                      model.sortedRows,
                      clientVehicleRecordCsvColumns,
                    ),
                  )
                }
              />
              <DataTableViewOptions table={table} />
            </>
          }
          activeFilterCount={model.activeFilterCount}
          onClearFilters={model.clearFilters}
        >
          <DataTableSearch
            ariaLabel={clientsCopy.vehicles.searchAriaLabel}
            onChange={model.state.handleSearchChange}
            onClear={model.state.clearSearch}
            onSubmit={model.state.submitSearch}
            placeholder={
              showDriver
                ? clientsCopy.vehicles.searchWithDriverPlaceholder
                : clientsCopy.vehicles.searchWithoutDriverPlaceholder
            }
            value={model.state.searchDraft}
          />
          {model.facet.items.length > 1 ? (
            <DataTableComboboxFilter
              ariaLabel={clientsCopy.vehicles.filterAriaLabel}
              clearAriaLabel={clientsCopy.vehicles.filterClearAriaLabel}
              counts={model.facet.counts}
              items={model.facet.items}
              onValueChange={model.onFacetValueChange}
              placeholder={clientsCopy.vehicles.filterPlaceholder}
              value={model.facetValue}
            />
          ) : null}
        </DataTableToolbar>

        <DataTableUpdating
          active={vehiclesQuery.isFetching && !vehiclesQuery.isPending}
        />

        <DataTable
          caption={clientsCopy.vehicles.caption}
          emptyState={
            <DataTableEmpty
              emptyDescription={clientsCopy.vehicles.emptyDescription}
              emptyTitle={clientsCopy.vehicles.emptyTitle}
              hasFilters={model.hasActiveFilters}
              onClearFilters={model.clearFilters}
            />
          }
          isInitialLoading={vehiclesQuery.isPending}
          table={table}
        />

        {!vehiclesQuery.isPending ? (
          <DataTablePagination
            itemLabel={clientsCopy.vehicles.itemLabel}
            rowCount={model.filteredRows.length}
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
          <RecordDetails
            record={selectedVehicle}
            sections={clientVehicleRecordSections}
          />
        </AppSheet>
      ) : null}
    </>
  )
}
