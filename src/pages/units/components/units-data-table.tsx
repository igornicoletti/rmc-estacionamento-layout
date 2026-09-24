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
} from "@/components/data-table/components/data-table-state"
import { DataTableToolbar } from "@/components/data-table/components/data-table-toolbar"
import { DataTableViewOptions } from "@/components/data-table/components/data-table-view-options"
import { useLocalDataTableModel } from "@/components/data-table/hooks/use-local-data-table-model"
import { dataTableCopy } from "@/components/data-table/data-table.copy"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { downloadCsv, serializeCsv } from "@/lib/export-to-csv"
import { serializeRecordForClipboard } from "@/lib/format-record-fields"
import {
  createUnitsTableColumns,
  unitsTableApi,
} from "@/pages/units/components/units-table-columns"
import {
  loadPreviewUnits,
  unitPreviewQueryKeys,
} from "@/pages/units/data/unit-preview-data"
import type { Unit } from "@/pages/units/model/unit"
import {
  formatUnitCity,
  formatUnitName,
} from "@/pages/units/model/unit-presentation"
import {
  unitRecordCsvColumns,
  unitRecordSections,
} from "@/pages/units/model/unit-record-presentation"
import { unitsCopy } from "@/pages/units/units.copy"

const EMPTY_UNITS: Unit[] = []

function getUnitCityValue(unit: Unit) {
  return `${unit.stateCode}:${unit.city}`
}

function getUnitSearchText(unit: Unit) {
  return [
    unit.id,
    unit.tradeName,
    formatUnitName(unit.tradeName),
    unit.legalName,
    formatUnitName(unit.legalName),
    unit.cnpj,
    unit.brand,
    formatUnitName(unit.brand),
    unit.city,
    formatUnitCity(unit.city),
    unit.state,
    unit.stateCode,
  ].join(" ")
}

function getUnitSortValue(unit: Unit, columnId: string) {
  if (columnId === "tradeName") {
    return formatUnitName(unit.tradeName)
  }

  if (columnId === "legalName") {
    return formatUnitName(unit.legalName)
  }

  if (columnId === "brand") {
    return formatUnitName(unit.brand)
  }

  if (columnId === "city") {
    return formatUnitCity(unit.city)
  }

  return unit[columnId as keyof Unit]
}

export function UnitsDataTable() {
  const unitsQuery = useQuery({
    queryKey: unitPreviewQueryKeys.units,
    queryFn: loadPreviewUnits,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const units = unitsQuery.data ?? EMPTY_UNITS
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const model = useLocalDataTableModel({
    getFacetGroup: (unit: Unit) => unit.state,
    getFacetLabel: (unit: Unit) => formatUnitCity(unit.city),
    getFacetValue: getUnitCityValue,
    getSearchText: getUnitSearchText,
    getSortValue: getUnitSortValue,
    initialColumnVisibility: {
      brandCode: false,
      cityCode: false,
      coordinates: false,
      createdAt: false,
      state: false,
      synchronizedAt: false,
      updatedAt: false,
    },
    rows: units,
  })

  const handleCopyData = useCallback((unit: Unit) => {
    void copyToClipboard({
      errorDescription: dataTableCopy.rowActions.copyErrorDescription,
      successDescription: dataTableCopy.rowActions.copySuccessDescription,
      successTitle: dataTableCopy.rowActions.copySuccessTitle,
      value: serializeRecordForClipboard(unit, unitRecordSections),
    })
  }, [])

  const columns = useMemo(
    () =>
      createUnitsTableColumns({
        onCopyData: handleCopyData,
        onDetails: setSelectedUnit,
      }),
    [handleCopyData],
  )

  const table = unitsTableApi.useAppTable({
    columns,
    data: model.pageRows,
    getRowId: (unit) => unit.id,
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

  if (unitsQuery.isError) {
    return (
      <DataTableError
        description={unitsCopy.table.loadError}
        onRetry={() => void unitsQuery.refetch()}
      />
    )
  }

  return (
    <>
      <DataTableRoot isBusy={unitsQuery.isPending || unitsQuery.isFetching}>
        <DataTableToolbar
          actions={
            <>
              <DataTableExport
                disabled={model.sortedRows.length === 0}
                onExport={() =>
                  downloadCsv(
                    "unidades.csv",
                    serializeCsv(model.sortedRows, unitRecordCsvColumns),
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
            ariaLabel={unitsCopy.search.ariaLabel}
            onChange={model.state.handleSearchChange}
            onClear={model.state.clearSearch}
            onSubmit={model.state.submitSearch}
            placeholder={unitsCopy.search.placeholder}
            value={model.state.searchDraft}
          />
          <DataTableComboboxFilter
            ariaLabel={unitsCopy.cityFilter.ariaLabel}
            clearAriaLabel={unitsCopy.cityFilter.clearAriaLabel}
            counts={model.facet.counts}
            items={model.facet.items}
            onValueChange={model.onFacetValueChange}
            placeholder={unitsCopy.cityFilter.placeholder}
            value={model.facetValue}
          />
        </DataTableToolbar>

        <DataTable
          caption={unitsCopy.table.caption}
          emptyState={
            <DataTableEmpty
              emptyDescription={unitsCopy.table.emptyDescription}
              emptyTitle={unitsCopy.table.emptyTitle}
              hasFilters={model.hasActiveFilters}
              onClearFilters={model.clearFilters}
            />
          }
          isInitialLoading={unitsQuery.isPending}
          table={table}
        />

        {!unitsQuery.isPending ? (
          <DataTablePagination
            itemLabel={unitsCopy.table.itemLabel}
            rowCount={model.filteredRows.length}
            table={table}
          />
        ) : null}
      </DataTableRoot>

      {selectedUnit ? (
        <AppSheet
          description={`Código ${selectedUnit.id} · ${selectedUnit.cnpj}`}
          onOpenChange={(open) => {
            if (!open) setSelectedUnit(null)
          }}
          open
          title={formatUnitName(selectedUnit.tradeName)}
        >
          <RecordDetails
            record={selectedUnit}
            sections={unitRecordSections}
          />
        </AppSheet>
      ) : null}
    </>
  )
}
