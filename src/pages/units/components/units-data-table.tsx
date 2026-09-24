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

function getCityFilterValue(unit: Unit) {
  return `${unit.stateCode}:${unit.city}`
}

export function UnitsDataTable() {
  const unitsQuery = useQuery({
    queryKey: unitPreviewQueryKeys.units,
    queryFn: loadPreviewUnits,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const units = unitsQuery.data ?? EMPTY_UNITS
  const [cityFilter, setCityFilter] = useState<string>()
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const state = useDataTableState({
    initialColumnVisibility: {
      brandCode: false,
      cityCode: false,
      coordinates: false,
      createdAt: false,
      state: false,
      synchronizedAt: false,
      updatedAt: false,
    },
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

  const cityFacet = useMemo(() => {
    const itemMap = new Map<
      string,
      { group: string; label: string; value: string }
    >()
    const counts: Record<string, number> = {}

    for (const unit of units) {
      const value = getCityFilterValue(unit)
      counts[value] = (counts[value] ?? 0) + 1
      itemMap.set(value, {
        group: unit.state,
        label: formatUnitCity(unit.city),
        value,
      })
    }

    return {
      counts,
      items: [...itemMap.values()].sort(
        (left, right) =>
          left.group.localeCompare(right.group, "pt-BR") ||
          left.label.localeCompare(right.label, "pt-BR"),
      ),
    }
  }, [units])

  const handleCityFilterChange = (value: string | undefined) => {
    setCityFilter(value)
    state.onPaginationChange((current) => ({ ...current, pageIndex: 0 }))
  }

  const clearFilters = () => {
    state.clearFilters()
    setCityFilter(undefined)
  }

  const filteredUnits = useMemo(() => {
    const search = normalizeSearchText(state.globalFilter)

    return units.filter((unit) => {
      if (cityFilter && getCityFilterValue(unit) !== cityFilter) {
        return false
      }

      return (
        !search ||
        normalizeSearchText(
          [
            unit.id,
            unit.tradeName,
            unit.legalName,
            unit.cnpj,
            unit.brand,
            unit.city,
            unit.state,
            unit.stateCode,
          ].join(" "),
        ).includes(search)
      )
    })
  }, [cityFilter, state.globalFilter, units])

  const sortedUnits = useMemo(
    () =>
      sortRows(
        filteredUnits,
        state.sorting,
        (unit, columnId) => unit[columnId as keyof Unit],
      ),
    [filteredUnits, state.sorting],
  )

  const pageRows = useMemo(
    () => paginateRows(sortedUnits, state.pagination),
    [sortedUnits, state.pagination],
  )

  const table = unitsTableApi.useAppTable({
    columns,
    data: pageRows,
    getRowId: (unit) => unit.id,
    onColumnVisibilityChange: state.setColumnVisibility,
    onPaginationChange: state.onPaginationChange,
    onSortingChange: state.onSortingChange,
    rowCount: filteredUnits.length,
    state: {
      columnVisibility: state.columnVisibility,
      pagination: state.pagination,
      sorting: state.sorting,
    },
  })

  const hasActiveFilters = state.hasFilters || Boolean(cityFilter)

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
                disabled={sortedUnits.length === 0}
                onExport={() =>
                  downloadCsv(
                    "unidades.csv",
                    serializeCsv(sortedUnits, unitRecordCsvColumns),
                  )
                }
              />
              <DataTableViewOptions table={table} />
            </>
          }
          activeFilterCount={
            Number(Boolean(state.searchDraft.trim())) +
            Number(Boolean(cityFilter))
          }
          onClearFilters={clearFilters}
        >
          <DataTableSearch
            ariaLabel={unitsCopy.search.ariaLabel}
            onChange={state.handleSearchChange}
            onClear={state.clearSearch}
            onSubmit={state.submitSearch}
            placeholder={unitsCopy.search.placeholder}
            value={state.searchDraft}
          />
          <DataTableComboboxFilter
            ariaLabel={unitsCopy.cityFilter.ariaLabel}
            clearAriaLabel={unitsCopy.cityFilter.clearAriaLabel}
            counts={cityFacet.counts}
            items={cityFacet.items}
            onValueChange={handleCityFilterChange}
            placeholder={unitsCopy.cityFilter.placeholder}
            value={cityFilter}
          />
        </DataTableToolbar>

        <DataTable
          caption={unitsCopy.table.caption}
          emptyState={
            <DataTableEmpty
              emptyDescription={unitsCopy.table.emptyDescription}
              emptyTitle={unitsCopy.table.emptyTitle}
              hasFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          }
          isInitialLoading={unitsQuery.isPending}
          table={table}
        />

        {!unitsQuery.isPending ? (
          <DataTablePagination
            itemLabel={unitsCopy.table.itemLabel}
            rowCount={filteredUnits.length}
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
