import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"

import { DataTable } from "@/components/data-table/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header"
import { DataTableComboboxFilter } from "@/components/data-table/components/data-table-combobox-filter"
import { DataTablePagination } from "@/components/data-table/components/data-table-pagination"
import { DataTableRoot } from "@/components/data-table/components/data-table-root"
import {
  DataTableRowActions,
  DataTableRowActionsHeader,
} from "@/components/data-table/components/data-table-row-actions"
import { DataTableSearch } from "@/components/data-table/components/data-table-search"
import {
  DataTableEmpty,
  DataTableError,
} from "@/components/data-table/components/data-table-state"
import { DataTableToolbar } from "@/components/data-table/components/data-table-toolbar"
import { DataTableViewOptions } from "@/components/data-table/components/data-table-view-options"
import { createServerTableHook } from "@/components/data-table/hooks/create-server-table-hook"
import { useDataTableState } from "@/components/data-table/hooks/use-data-table-state"
import { getClientDetailsPath } from "@/pages/clients/client-routes"
import { ClientEmailCell } from "@/pages/clients/components/client-email-cell"
import {
  clientMockQueryKeys,
  loadMockClients,
} from "@/pages/clients/data/client-mock-data"
import { copyClientValue } from "@/pages/clients/lib/copy-client-value"
import {
  normalizeSearchText,
  paginateRows,
  sortRows,
} from "@/pages/clients/lib/client-table-utils"
import type { Client } from "@/pages/clients/model/client"
import {
  formatCityName,
  formatDate,
  formatDateTime,
  formatErpName,
  formatPhone,
  formatYesNo,
} from "@/pages/clients/model/client-presentation"

const EMPTY_CLIENTS: Client[] = []
const tableApi = createServerTableHook<Record<string, never>>()
const columnHelper = tableApi.createAppColumnHelper<Client>()

function getCityFilterValue(client: Client) {
  return `${client.stateCode}:${client.city}`
}

const columns = columnHelper.columns([
  columnHelper.accessor("id", {
    cell: ({ getValue }) => (
      <span className="tabular-nums text-muted-foreground">{getValue()}</span>
    ),
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Código" />
    ),
    meta: { visibilityLabel: "Código" },
  }),
  columnHelper.accessor("name", {
    cell: ({ getValue, row }) => (
      <Link
        className="block max-w-64 truncate font-medium underline-offset-4 hover:underline"
        to={getClientDetailsPath(row.original.id)}
      >
        {formatErpName(getValue())}
      </Link>
    ),
    enableHiding: false,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    meta: { visibilityLabel: "Nome" },
  }),
  columnHelper.accessor("tradeName", {
    cell: ({ getValue }) => formatErpName(getValue()),
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome fantasia" />
    ),
    meta: { visibilityLabel: "Nome fantasia" },
  }),
  columnHelper.accessor("taxId", {
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
    enableHiding: true,
    enableSorting: false,
    header: "CPF/CNPJ",
    meta: { visibilityLabel: "CPF/CNPJ" },
  }),
  columnHelper.accessor("email", {
    cell: ({ getValue }) => <ClientEmailCell value={getValue()} />,
    enableHiding: true,
    enableSorting: false,
    header: "E-mail",
    meta: { visibilityLabel: "E-mail" },
  }),
  columnHelper.accessor("phone", {
    cell: ({ getValue }) => formatPhone(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Telefone",
    meta: { visibilityLabel: "Telefone" },
  }),
  columnHelper.accessor("city", {
    cell: ({ getValue }) => formatCityName(getValue()),
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cidade" />
    ),
    meta: { visibilityLabel: "Cidade" },
  }),
  columnHelper.accessor("stateCode", {
    enableHiding: true,
    enableSorting: false,
    header: "UF",
    meta: { visibilityLabel: "UF" },
  }),
  columnHelper.accessor("registeredAt", {
    cell: ({ getValue }) => formatDate(getValue()),
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cadastro" />
    ),
    meta: { visibilityLabel: "Cadastro" },
  }),
  columnHelper.accessor("personActiveStatus", {
    cell: ({ getValue }) => formatYesNo(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Pessoa ativa",
    meta: { visibilityLabel: "Pessoa ativa" },
  }),
  columnHelper.accessor("financialBlockStatus", {
    cell: ({ getValue }) => formatYesNo(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Bloqueio financeiro",
    meta: { visibilityLabel: "Bloqueio financeiro" },
  }),
  columnHelper.accessor("vehicleCount", {
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Veículos" />
    ),
    meta: { visibilityLabel: "Veículos" },
  }),
  columnHelper.accessor("lastPurchaseAt", {
    cell: ({ getValue }) => formatDate(getValue()),
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Última compra" />
    ),
    meta: { visibilityLabel: "Última compra" },
  }),
  columnHelper.accessor("activeWithin120Days", {
    cell: ({ getValue }) => formatYesNo(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Ativo em 120 dias",
    meta: { visibilityLabel: "Ativo em 120 dias" },
  }),
  columnHelper.accessor("sourceHash", {
    enableHiding: true,
    enableSorting: false,
    header: "Hash da origem",
    meta: { visibilityLabel: "Hash da origem" },
  }),
  columnHelper.accessor("sourceUpdatedAt", {
    cell: ({ getValue }) => formatDateTime(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Atualização na origem",
    meta: { visibilityLabel: "Atualização na origem" },
  }),
  columnHelper.accessor("synchronizedAt", {
    cell: ({ getValue }) => formatDateTime(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Sincronização",
    meta: { visibilityLabel: "Sincronização" },
  }),
  columnHelper.accessor("createdAt", {
    cell: ({ getValue }) => formatDateTime(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Criação",
    meta: { visibilityLabel: "Criação" },
  }),
  columnHelper.accessor("updatedAt", {
    cell: ({ getValue }) => formatDateTime(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Atualização",
    meta: { visibilityLabel: "Atualização" },
  }),
  columnHelper.display({
    cell: ({ row }) => (
      <DataTableRowActions
        accessibleLabel={`Ações do cliente ${formatErpName(row.original.name)}`}
        copyLabel="Copiar código"
        onCopy={() =>
          void copyClientValue({
            errorDescription: "Não foi possível copiar o código do cliente.",
            successTitle: "Código copiado",
            value: row.original.id,
          })
        }
      />
    ),
    enableHiding: false,
    header: DataTableRowActionsHeader,
    id: "actions",
  }),
])

export function ClientsDataTable() {
  const clientsQuery = useQuery({
    queryKey: clientMockQueryKeys.clients,
    queryFn: loadMockClients,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const clients = clientsQuery.data ?? EMPTY_CLIENTS
  const [cityFilter, setCityFilter] = useState<string>()
  const state = useDataTableState({
    initialColumnVisibility: {
      activeWithin120Days: false,
      createdAt: false,
      financialBlockStatus: false,
      id: false,
      personActiveStatus: false,
      phone: false,
      registeredAt: false,
      sourceHash: false,
      sourceUpdatedAt: false,
      synchronizedAt: false,
      tradeName: false,
      updatedAt: false,
    },
  })

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

  const table = tableApi.useAppTable({
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
        description="Não foi possível carregar o mock local de clientes."
        onRetry={() => void clientsQuery.refetch()}
      />
    )
  }

  return (
    <DataTableRoot isBusy={clientsQuery.isPending || clientsQuery.isFetching}>
      <DataTableToolbar
        actions={<DataTableViewOptions table={table} />}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        <DataTableSearch
          ariaLabel="Buscar clientes"
          onChange={state.handleSearchChange}
          onClear={state.clearSearch}
          onSubmit={state.submitSearch}
          placeholder="Buscar clientes..."
          value={state.searchDraft}
        />
        <DataTableComboboxFilter
          ariaLabel="Filtrar por cidade"
          clearAriaLabel="Limpar filtro de cidade"
          counts={cityFacet.counts}
          items={cityFacet.items}
          onValueChange={handleCityFilterChange}
          placeholder="Todas as cidades"
          searchAriaLabel="Buscar cidade"
          searchPlaceholder="Buscar cidade..."
          value={cityFilter}
        />
      </DataTableToolbar>

      <DataTable
        caption="Lista de clientes"
        emptyState={
          <DataTableEmpty
            emptyDescription="Nenhum cliente foi carregado no mock local."
            emptyTitle="Nenhum cliente disponível"
            hasFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        }
        isInitialLoading={clientsQuery.isPending}
        table={table}
      />

      {!clientsQuery.isPending ? (
        <DataTablePagination
          itemLabel={{ singular: "cliente", plural: "clientes" }}
          rowCount={filteredClients.length}
          table={table}
        />
      ) : null}
    </DataTableRoot>
  )
}
