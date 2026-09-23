import { useMemo, useState } from "react"

import { DataTable } from "@/components/data-table/components/data-table"
import { DataTableComboboxFilter } from "@/components/data-table/components/data-table-combobox-filter"
import { DataTablePagination } from "@/components/data-table/components/data-table-pagination"
import { DataTableRoot } from "@/components/data-table/components/data-table-root"
import { DataTableSearch } from "@/components/data-table/components/data-table-search"
import { DataTableEmpty } from "@/components/data-table/components/data-table-state"
import { DataTableToolbar } from "@/components/data-table/components/data-table-toolbar"
import { DataTableViewOptions } from "@/components/data-table/components/data-table-view-options"
import { normalizeSearchText, paginateRows, sortRows } from "@/components/data-table/core/table-data-utils"
import { useDataTableState } from "@/components/data-table/hooks/use-data-table-state"
import { unitsTableApi, unitsTableColumns } from "@/pages/units/components/units-table-columns"
import { unitErpFixture } from "@/pages/units/data/unit-erp.fixture"
import { mapErpUnits } from "@/pages/units/model/unit-mapper"
import type { Unit } from "@/pages/units/model/unit"
import { unitsCopy } from "@/pages/units/units.copy"

const units = mapErpUnits(unitErpFixture)

function getCityFilterValue(unit: Unit) {
  return `${unit.stateCode}:${unit.city}`
}

export function UnitsDataTable() {
  const [cityFilter, setCityFilter] = useState<string>()
  const state = useDataTableState({ initialColumnVisibility: { brandCode: false, cityCode: false, coordinates: false, createdAt: false, state: false, synchronizedAt: false, updatedAt: false } })
  const cityFacet = useMemo(() => {
    const itemMap = new Map<string, { group: string; label: string; value: string }>()
    const counts: Record<string, number> = {}
    for (const unit of units) {
      const value = getCityFilterValue(unit)
      counts[value] = (counts[value] ?? 0) + 1
      itemMap.set(value, { group: unit.state, label: unit.city, value })
    }
    return { counts, items: [...itemMap.values()].sort((left, right) => left.group.localeCompare(right.group, "pt-BR") || left.label.localeCompare(right.label, "pt-BR")) }
  }, [])
  const clearFilters = () => { state.clearFilters(); setCityFilter(undefined) }
  const filteredUnits = useMemo(() => {
    const search = normalizeSearchText(state.globalFilter)
    return units.filter((unit) => {
      if (cityFilter && getCityFilterValue(unit) !== cityFilter) return false
      return !search || normalizeSearchText([unit.id, unit.tradeName, unit.legalName, unit.cnpj, unit.brand, unit.city, unit.state, unit.stateCode].join(" ")).includes(search)
    })
  }, [cityFilter, state.globalFilter])
  const sortedUnits = useMemo(() => sortRows(filteredUnits, state.sorting, (unit, columnId) => unit[columnId as keyof Unit]), [filteredUnits, state.sorting])
  const pageRows = useMemo(() => paginateRows(sortedUnits, state.pagination), [sortedUnits, state.pagination])
  const table = unitsTableApi.useAppTable({ columns: unitsTableColumns, data: pageRows, getRowId: (unit) => unit.id, onColumnVisibilityChange: state.setColumnVisibility, onPaginationChange: state.onPaginationChange, onSortingChange: state.onSortingChange, rowCount: filteredUnits.length, state: { columnVisibility: state.columnVisibility, pagination: state.pagination, sorting: state.sorting } })
  const hasActiveFilters = state.hasFilters || Boolean(cityFilter)

  return (
    <DataTableRoot isBusy={false}>
      <DataTableToolbar actions={<DataTableViewOptions table={table} />} hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters}>
        <DataTableSearch ariaLabel={unitsCopy.search.ariaLabel} onChange={state.handleSearchChange} onClear={state.clearSearch} onSubmit={state.submitSearch} placeholder={unitsCopy.search.placeholder} value={state.searchDraft} />
        <DataTableComboboxFilter ariaLabel={unitsCopy.cityFilter.ariaLabel} clearAriaLabel={unitsCopy.cityFilter.clearAriaLabel} counts={cityFacet.counts} items={cityFacet.items} onValueChange={(value) => { setCityFilter(value); state.onPaginationChange((current) => ({ ...current, pageIndex: 0 })) }} placeholder={unitsCopy.cityFilter.placeholder} searchAriaLabel={unitsCopy.cityFilter.searchAriaLabel} searchPlaceholder={unitsCopy.cityFilter.searchPlaceholder} value={cityFilter} />
      </DataTableToolbar>
      <DataTable caption={unitsCopy.table.caption} emptyState={<DataTableEmpty emptyDescription={unitsCopy.table.emptyDescription} emptyTitle={unitsCopy.table.emptyTitle} hasFilters={hasActiveFilters} onClearFilters={clearFilters} />} isInitialLoading={false} table={table} />
      <DataTablePagination itemLabel={unitsCopy.table.itemLabel} rowCount={filteredUnits.length} table={table} />
    </DataTableRoot>
  )
}
