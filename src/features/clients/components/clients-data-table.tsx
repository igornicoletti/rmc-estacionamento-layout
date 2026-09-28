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
import { createClientsTableColumns } from "@/features/clients/components/clients-table-columns"
import { clientsContent } from "@/features/clients/content/clients-content"
import type { Client } from "@/features/clients/contracts/clients-types"
import { formatCityName } from "@/features/clients/presentation/clients-format"
import {
  clientRecordCsvColumns,
  clientRecordSections,
} from "@/features/clients/presentation/clients-record"
import {
  clientsQueryKeys,
  loadDemoClients,
} from "@/features/clients/queries/clients-query"

const EMPTY_CLIENTS: Client[] = []

export function ClientsDataTable() {
  const query = useQuery({
    queryKey: clientsQueryKeys.clients,
    queryFn: loadDemoClients,
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

  const clients = query.data ?? EMPTY_CLIENTS
  const copyClient = useCallback(
    (client: Client) =>
      copyToClipboard(
        serializeRecordForClipboard(client, clientRecordSections),
      ),
    [],
  )
  const columns = useMemo(
    () => createClientsTableColumns({ onCopyData: copyClient }),
    [copyClient],
  )

  const table = useDataTable({
    columns,
    data: clients,
    getRowId: (client) => client.id,
    initialState: {
      columnVisibility: {
        cityFacet: false,
        financialBlockStatus: false,
        id: false,
        personActiveStatus: false,
        phone: false,
        registeredAt: false,
        tradeName: false,
      },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  })

  const cityColumn = table.getColumn("cityFacet")
  const cityValue = cityColumn?.getFilterValue() as string | undefined
  const cityCounts = new Map<string, number>(
    cityColumn?.getFacetedUniqueValues() as Map<string, number> | undefined,
  )
  const cityLabels = new Map(
    clients.map((client) => [
      `${client.stateCode}:${client.city}`,
      {
        group: client.state,
        label: formatCityName(client.city),
        value: `${client.stateCode}:${client.city}`,
      },
    ]),
  )
  const cityItems = Array.from(cityLabels.values()).sort(
    (left, right) =>
      left.group.localeCompare(right.group, "pt-BR") ||
      left.label.localeCompare(right.label, "pt-BR"),
  )

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
        description={clientsContent.list.loadError}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <DataTableRoot isBusy={query.isFetching}>
      <DataTableToolbar
        actions={
          <DataTableActions
            csvColumns={clientRecordCsvColumns}
            filename="clientes.csv"
            isBusy={isInitialPending}
            table={table}
          />
        }
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      >
        <DataTableSearch
          ariaLabel={clientsContent.list.searchAriaLabel}
          disabled={isInitialPending}
          onChange={table.setGlobalFilter}
          onClear={() => table.setGlobalFilter("")}
          placeholder={clientsContent.list.searchPlaceholder}
          value={search}
        />
        <DataTableComboboxFilter
          ariaLabel={clientsContent.list.cityFilterAriaLabel}
          clearAriaLabel={clientsContent.list.cityFilterClearAriaLabel}
          counts={cityCounts}
          disabled={isInitialPending}
          items={cityItems}
          onValueChange={(value) => cityColumn?.setFilterValue(value)}
          placeholder={clientsContent.list.cityFilterPlaceholder}
          value={cityValue}
        />
      </DataTableToolbar>
      <DataTableUpdating active={query.isRefetching} />
      <DataTable
        caption={clientsContent.list.caption}
        emptyState={
          <DataTableEmpty
            emptyDescription={clientsContent.list.emptyDescription}
            emptyTitle={clientsContent.list.emptyTitle}
            hasFilters={activeFilterCount > 0}
            onClearFilters={clearFilters}
          />
        }
        isLoading={isInitialPending}
        table={table}
      />
      {!isInitialPending ? (
        <DataTablePagination
          itemLabel={clientsContent.list.itemLabel}
          rowCount={rowCount}
          table={table}
        />
      ) : null}
    </DataTableRoot>
  )
}
