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

function getClientCityValue(client: Client) {
  return `${client.stateCode}:${client.city}`
}

function getClientCityGroup(client: Client) {
  return client.state
}

function getClientCityLabel(client: Client) {
  return formatCityName(client.city)
}

function getClientSearchText(client: Client) {
  return [
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
  ].join(" ")
}

function getClientSortValue(client: Client, columnId: string) {
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
}

export function ClientsDataTable() {
  const clientsQuery = useQuery({
    queryKey: clientPreviewQueryKeys.clients,
    queryFn: loadPreviewClients,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const clients = clientsQuery.data ?? EMPTY_CLIENTS
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const model = useLocalDataTableModel({
    getFacetGroup: getClientCityGroup,
    getFacetLabel: getClientCityLabel,
    getFacetValue: getClientCityValue,
    getSearchText: getClientSearchText,
    getSortValue: getClientSortValue,
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
    rows: clients,
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

  const table = clientsTableApi.useAppTable({
    columns,
    data: model.pageRows,
    getRowId: (client) => client.id,
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
                disabled={model.sortedRows.length === 0}
                onExport={() =>
                  downloadCsv(
                    "clientes.csv",
                    serializeCsv(model.sortedRows, clientRecordCsvColumns),
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
            ariaLabel={clientsCopy.list.searchAriaLabel}
            onChange={model.state.handleSearchChange}
            onClear={model.state.clearSearch}
            onSubmit={model.state.submitSearch}
            placeholder={clientsCopy.list.searchPlaceholder}
            value={model.state.searchDraft}
          />
          <DataTableComboboxFilter
            ariaLabel={clientsCopy.list.cityFilterAriaLabel}
            clearAriaLabel={clientsCopy.list.cityFilterClearAriaLabel}
            counts={model.facet.counts}
            items={model.facet.items}
            onValueChange={model.onFacetValueChange}
            placeholder={clientsCopy.list.cityFilterPlaceholder}
            value={model.facetValue}
          />
        </DataTableToolbar>

        <DataTableUpdating
          active={clientsQuery.isFetching && !clientsQuery.isPending}
        />

        <DataTable
          caption={clientsCopy.list.caption}
          emptyState={
            <DataTableEmpty
              emptyDescription={clientsCopy.list.emptyDescription}
              emptyTitle={clientsCopy.list.emptyTitle}
              hasFilters={model.hasActiveFilters}
              onClearFilters={model.clearFilters}
            />
          }
          isInitialLoading={clientsQuery.isPending}
          table={table}
        />

        {!clientsQuery.isPending ? (
          <DataTablePagination
            itemLabel={clientsCopy.list.itemLabel}
            rowCount={model.filteredRows.length}
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
          <RecordDetails
            record={selectedClient}
            sections={clientRecordSections}
          />
        </AppSheet>
      ) : null}
    </>
  )
}
