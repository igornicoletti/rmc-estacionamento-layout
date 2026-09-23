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
  clientsTableApi,
  createClientsTableColumns,
} from "@/pages/clients/components/clients-table-columns"
import {
  clientPreviewQueryKeys,
  loadPreviewClients,
} from "@/pages/clients/data/client-preview-data"
import type { Client } from "@/pages/clients/model/client"
import {
  clientRecordCsvColumns,
  clientRecordSections,
} from "@/pages/clients/model/client-record-presentation"
import {
  formatCityName,
  formatErpName,
  formatPhone,
} from "@/pages/clients/model/client-presentation"

const EMPTY_CLIENTS: Client[] = []

function getCityFilterValue(client: Client) {
  return `${client.stateCode}:${client.city}`
}

export function ClientsDataTable() {
  const clientsQuery = useQuery({
    queryKey: clientPreviewQueryKeys.clients,
    queryFn: loadPreviewClients,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const clients = clientsQuery.data ?? EMPTY_CLIENTS
  const [cityFilter, setCityFilter] = useState<string>()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const state = useDataTableState({
    initialColumnVisibility: {
      activeWithin120Days: false,
      createdAt: false,
      financialBlockStatus: false,
      id: false,
      personActiveStatus: false,
      phone: false,
      registeredAt: false,
      synchronizedAt: false,
      tradeName: false,
      updatedAt: false,
    },
  })

  const handleCopyData = useCallback((client: Client) => {
    void copyToClipboard({
      errorDescription: dataTableCopy.rowActions.copyErrorDescription,
      successDescription: dataTableCopy.rowActions.copySuccessDescription,
      successTitle: dataTableCopy.rowActions.copySuccessTitle,
      value: serializeRecordForClipboard(client, clientRecordSections),
    })
  }, [])

  const columns = useMemo(
    () =>
      createClientsTableColumns({
        onCopyData: handleCopyData,
        onDetails: setSelectedClient,
      }),
    [handleCopyData],
  )

  const cityFacet = useMemo(() => {
    const items = new Map<
      string,
      { group: string; label: string; value: string }
    >()
    const counts: Record<string, number> = {}

    for (const client of clients) {
      const value = getCityFilterValue(client)
      counts[value] = (counts[value] ?? 0) + 1

      if (!items.has(value)) {
        items.set(value, {
          group: client.state,
          label: formatCityName(client.city),
          value,
        })
      }
    }

    return {
      counts,
      items: Array.from(items.values()).sort(
        (left, right) =>
          left.group.localeCompare(right.group, "pt-BR") ||
          left.label.localeCompare(right.label, "pt-BR"),
      ),
    }
  }, [clients])

  const handleCityFilterChange = (value: string | undefined) => {
    setCityFilter(value)
    state.onPaginationChange((current) => ({ ...current, pageIndex: 0 }))
  }

  const clearFilters = () => {
    state.clearFilters()
    setCityFilter(undefined)
  }

  const filteredClients = useMemo(() => {
    const search = normalizeSearchText(state.globalFilter)

    return clients.filter((client) => {
      if (cityFilter && getCityFilterValue(client) !== cityFilter) {
        return false
      }

      if (!search) {
        return true
      }

      return normalizeSearchText(
        [
          client.id,
          client.name,
          formatErpName(client.name),
          client.tradeName,
          formatErpName(client.tradeName),
          client.taxId,
          client.email,
          client.phone,
          formatPhone(client.phone),
          client.city,
          formatCityName(client.city),
          client.state,
          client.stateCode,
          client.personActiveStatus,
          client.financialBlockStatus,
        ].join(" "),
      ).includes(search)
    })
  }, [cityFilter, clients, state.globalFilter])

  const sortedClients = useMemo(
    () =>
      sortRows(filteredClients, state.sorting, (client, columnId) => {
        if (columnId === "name") {
          return formatErpName(client.name)
        }

        if (columnId === "tradeName") {
          return formatErpName(client.tradeName)
        }

        if (columnId === "city") {
          return formatCityName(client.city)
        }

        return client[columnId as keyof Client]
      }),
    [filteredClients, state.sorting],
  )

  const paginatedClients = useMemo(
    () => paginateRows(sortedClients, state.pagination),
    [sortedClients, state.pagination],
  )

  const table = clientsTableApi.useAppTable({
    columns,
    data: paginatedClients,
    getRowId: (client) => client.id,
    onColumnVisibilityChange: state.setColumnVisibility,
    onPaginationChange: state.onPaginationChange,
    onSortingChange: state.onSortingChange,
    rowCount: filteredClients.length,
    state: {
      columnVisibility: state.columnVisibility,
      pagination: state.pagination,
      sorting: state.sorting,
    },
  })

  const hasActiveFilters = state.hasFilters || Boolean(cityFilter)

  if (clientsQuery.isError) {
    return (
      <DataTableError
        description={clientsCopy.list.loadError}
        onRetry={() => void clientsQuery.refetch()}
      />
    )
  }

  return (
    <>
      <DataTableRoot isBusy={clientsQuery.isPending || clientsQuery.isFetching}>
        <DataTableToolbar
          actions={
            <>
              <DataTableExport
                disabled={sortedClients.length === 0}
                onExport={() =>
                  downloadCsv(
                    "clientes.csv",
                    serializeCsv(sortedClients, clientRecordCsvColumns),
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
            ariaLabel={clientsCopy.list.searchAriaLabel}
            onChange={state.handleSearchChange}
            onClear={state.clearSearch}
            onSubmit={state.submitSearch}
            placeholder={clientsCopy.list.searchPlaceholder}
            value={state.searchDraft}
          />
          <DataTableComboboxFilter
            ariaLabel={clientsCopy.list.cityFilterAriaLabel}
            clearAriaLabel={clientsCopy.list.cityFilterClearAriaLabel}
            counts={cityFacet.counts}
            items={cityFacet.items}
            onValueChange={handleCityFilterChange}
            placeholder={clientsCopy.list.cityFilterPlaceholder}
            value={cityFilter}
          />
        </DataTableToolbar>

        <DataTable
          caption={clientsCopy.list.caption}
          emptyState={
            <DataTableEmpty
              emptyDescription={clientsCopy.list.emptyDescription}
              emptyTitle={clientsCopy.list.emptyTitle}
              hasFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          }
          isInitialLoading={clientsQuery.isPending}
          table={table}
        />

        {!clientsQuery.isPending ? (
          <DataTablePagination
            itemLabel={clientsCopy.list.itemLabel}
            rowCount={filteredClients.length}
            table={table}
          />
        ) : null}
      </DataTableRoot>

      {selectedClient ? (
        <AppSheet
          description={`Código ${selectedClient.id} · ${selectedClient.taxId}`}
          onOpenChange={(open) => {
            if (!open) setSelectedClient(null)
          }}
          open
          title={formatErpName(selectedClient.name)}
        >
          <AppRecordDetails
            record={selectedClient}
            sections={clientRecordSections}
          />
        </AppSheet>
      ) : null}
    </>
  )
}
