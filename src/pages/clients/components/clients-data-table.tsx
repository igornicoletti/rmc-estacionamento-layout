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
import { createClientsTableColumns } from "@/pages/clients/components/clients-table-columns"
import { clientPreviewQueryKeys, loadPreviewClients } from "@/pages/clients/data/client-preview-data"
import type { Client } from "@/pages/clients/model/client"
import { formatCityName } from "@/pages/clients/model/client-presentation"
import { clientRecordCsvColumns, clientRecordSections } from "@/pages/clients/model/client-record-presentation"

const EMPTY_CLIENTS: Client[] = []

export function ClientsDataTable() {
  const query = useQuery({ queryKey: clientPreviewQueryKeys.clients, queryFn: loadPreviewClients, staleTime: Number.POSITIVE_INFINITY })
  const clients = query.data ?? EMPTY_CLIENTS
  const copyClient = useCallback((client: Client) => copyToClipboard(serializeRecordForClipboard(client, clientRecordSections)), [])
  const columns = useMemo(() => createClientsTableColumns({ onCopyData: copyClient }), [copyClient])

  const table = useDataTable({
    columns,
    data: clients,
    getRowId: (client) => client.id,
    initialState: {
      columnVisibility: {
        activeWithin120Days: false, cityFacet: false, createdAt: false,
        financialBlockStatus: false, id: false, personActiveStatus: false,
        phone: false, registeredAt: false, synchronizedAt: false,
        tradeName: false, updatedAt: false,
      },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  })

  const cityColumn = table.getColumn("cityFacet")
  const cityValue = cityColumn?.getFilterValue() as string | undefined
  const cityCounts = new Map<string, number>(cityColumn?.getFacetedUniqueValues() as Map<string, number> | undefined)
  const cityLabels = new Map(clients.map((client) => [
    `${client.stateCode}:${client.city}`,
    { group: client.state, label: formatCityName(client.city), value: `${client.stateCode}:${client.city}` },
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
    return <DataTableError description={clientsCopy.list.loadError} onRetry={() => void query.refetch()} />
  }

  return (
    <DataTableRoot isBusy={query.isPending || query.isFetching}>
      <DataTableToolbar
        actions={<><DataTableExport disabled={exportRows.length === 0} onExport={() => downloadCsv("clientes.csv", serializeCsv(exportRows, clientRecordCsvColumns))} /><DataTableViewOptions table={table} /></>}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      >
        <DataTableSearch ariaLabel={clientsCopy.list.searchAriaLabel} onChange={table.setGlobalFilter} onClear={() => table.setGlobalFilter("")} placeholder={clientsCopy.list.searchPlaceholder} value={search} />
        <DataTableComboboxFilter
          ariaLabel={clientsCopy.list.cityFilterAriaLabel}
          clearAriaLabel={clientsCopy.list.cityFilterClearAriaLabel}
          counts={cityCounts}
          items={cityItems}
          onValueChange={(value) => cityColumn?.setFilterValue(value)}
          placeholder={clientsCopy.list.cityFilterPlaceholder}
          value={cityValue}
        />
      </DataTableToolbar>
      <DataTableUpdating active={query.isFetching && !query.isPending} />
      <DataTable
        caption={clientsCopy.list.caption}
        emptyState={<DataTableEmpty emptyDescription={clientsCopy.list.emptyDescription} emptyTitle={clientsCopy.list.emptyTitle} hasFilters={activeFilterCount > 0} onClearFilters={clearFilters} />}
        isInitialLoading={query.isPending}
        table={table}
      />
      {!query.isPending ? <DataTablePagination itemLabel={clientsCopy.list.itemLabel} rowCount={table.getPrePaginatedRowModel().rows.length} table={table} /> : null}
    </DataTableRoot>
  )
}
