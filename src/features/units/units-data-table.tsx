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
import { createUnitsTableColumns } from "@/features/units/units-table-columns"
import { loadDemoUnits, unitsQueryKeys } from "@/features/units/units-query"
import type { Unit } from "@/features/units/units-types"
import { formatUnitCity } from "@/features/units/units-format"
import { unitRecordCsvColumns, unitRecordSections } from "@/features/units/units-record"
import { unitsContent } from "@/features/units/units-content"

const EMPTY_UNITS: Unit[] = []

export function UnitsDataTable() {
  const query = useQuery({ queryKey: unitsQueryKeys.units, queryFn: loadDemoUnits, staleTime: Number.POSITIVE_INFINITY })
  const units = query.data ?? EMPTY_UNITS
  const copyUnit = useCallback((unit: Unit) => copyToClipboard(serializeRecordForClipboard(unit, unitRecordSections)), [])
  const columns = useMemo(() => createUnitsTableColumns({ onCopyData: copyUnit }), [copyUnit])

  const table = useDataTable({
    columns,
    data: units,
    getRowId: (unit) => unit.id,
    initialState: {
      columnVisibility: {
        brandCode: false, cityCode: false, cityFacet: false, coordinates: false,
        createdAt: false, state: false, synchronizedAt: false, updatedAt: false,
      },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  })

  const cityColumn = table.getColumn("cityFacet")
  const cityValue = cityColumn?.getFilterValue() as string | undefined
  const cityCounts = new Map<string, number>(cityColumn?.getFacetedUniqueValues() as Map<string, number> | undefined)
  const cityLabels = new Map(units.map((unit) => [
    `${unit.stateCode}:${unit.city}`,
    { group: unit.state, label: formatUnitCity(unit.city), value: `${unit.stateCode}:${unit.city}` },
  ]))
  const cityItems = Array.from(cityLabels.values()).sort((left, right) =>
    left.group.localeCompare(right.group, "pt-BR") || left.label.localeCompare(right.label, "pt-BR"),
  )

  const search = String(table.state.globalFilter ?? "")
  const activeFilterCount = Number(Boolean(search.trim())) + table.state.columnFilters.length
  const clearFilters = () => {
    table.setGlobalFilter("")
    table.resetColumnFilters()
  }
  const exportRows = table.getPrePaginatedRowModel().rows.map((row) => row.original)

  if (query.isError) {
    return <DataTableError description={unitsContent.list.loadError} onRetry={() => void query.refetch()} />
  }

  return (
    <DataTableRoot isBusy={query.isPending || query.isFetching}>
      <DataTableToolbar
        actions={<><DataTableExport disabled={exportRows.length === 0} onExport={() => downloadCsv("unidades.csv", serializeCsv(exportRows, unitRecordCsvColumns))} /><DataTableViewOptions table={table} /></>}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      >
        <DataTableSearch ariaLabel={unitsContent.list.searchAriaLabel} onChange={table.setGlobalFilter} onClear={() => table.setGlobalFilter("")} placeholder={unitsContent.list.searchPlaceholder} value={search} />
        <DataTableComboboxFilter
          ariaLabel={unitsContent.list.cityFilterAriaLabel}
          clearAriaLabel={unitsContent.list.cityFilterClearAriaLabel}
          counts={cityCounts}
          items={cityItems}
          onValueChange={(value) => cityColumn?.setFilterValue(value)}
          placeholder={unitsContent.list.cityFilterPlaceholder}
          value={cityValue}
        />
      </DataTableToolbar>
      <DataTableUpdating active={query.isFetching && !query.isPending} />
      <DataTable
        caption={unitsContent.list.caption}
        emptyState={<DataTableEmpty emptyDescription={unitsContent.list.emptyDescription} emptyTitle={unitsContent.list.emptyTitle} hasFilters={activeFilterCount > 0} onClearFilters={clearFilters} />}
        isInitialLoading={query.isPending}
        table={table}
      />
      {!query.isPending ? <DataTablePagination itemLabel={unitsContent.list.itemLabel} rowCount={table.getPrePaginatedRowModel().rows.length} table={table} /> : null}
    </DataTableRoot>
  )
}
