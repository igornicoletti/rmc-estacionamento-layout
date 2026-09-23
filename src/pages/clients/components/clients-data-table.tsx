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
import { toast } from "@/components/ui/toast"
import { getClientDetailsPath } from "@/pages/clients/client-routes"
import {
  clientMockQueryKeys,
  loadMockClients,
} from "@/pages/clients/data/client-mock-data"
import type { Client } from "@/pages/clients/model/client"

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
})

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const EMPTY_CLIENTS: Client[] = []
const tableApi = createServerTableHook<Record<string, never>>()
const columnHelper = tableApi.createAppColumnHelper<Client>()

function formatDate(value: string | null) {
  return value
    ? dateFormatter.format(new Date(`${value}T00:00:00.000Z`))
    : "—"
}

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "—"
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("pt-BR")
}

function getCityFilterValue(client: Client) {
  return `${client.stateCode}:${client.city}`
}

async function copyClientId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    toast.add({ description: id, title: "Código copiado", type: "success" })
  } catch {
    toast.add({
      description: "Não foi possível copiar o código do cliente.",
      title: "Falha ao copiar",
      type: "error",
    })
  }
}

const columns = columnHelper.columns([
  columnHelper.accessor("id", {
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
        className="font-medium underline-offset-4 hover:underline"
        to={getClientDetailsPath(row.original.id)}
      >
        {getValue()}
      </Link>
    ),
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    meta: { visibilityLabel: "Nome" },
  }),
  columnHelper.accessor("tradeName", {
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome fantasia" />
    ),
    meta: { visibilityLabel: "Nome fantasia" },
  }),
  columnHelper.accessor("taxId", {
    enableHiding: true,
    enableSorting: false,
    header: "CPF/CNPJ",
    meta: { visibilityLabel: "CPF/CNPJ" },
  }),
  columnHelper.accessor("email", {
    enableHiding: true,
    enableSorting: false,
    header: "E-mail",
    meta: { visibilityLabel: "E-mail" },
  }),
  columnHelper.accessor("phone", {
    enableHiding: true,
    enableSorting: false,
    header: "Telefone",
    meta: { visibilityLabel: "Telefone" },
  }),
  columnHelper.accessor("city", {
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
    enableHiding: true,
    enableSorting: false,
    header: "Pessoa ativa",
    meta: { visibilityLabel: "Pessoa ativa" },
  }),
  columnHelper.accessor("financialBlockStatus", {
    enableHiding: true,
    enableSorting: false,
    header: "Bloqueio financeiro",
    meta: { visibilityLabel: "Bloqueio financeiro" },
  }),
  columnHelper.accessor("vehicleCount", {
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
    cell: ({ getValue }) => (getValue() ? "Sim" : "Não"),
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
        accessibleLabel={`Ações do cliente ${row.original.name}`}
        copyLabel="Copiar código"
        onCopy={() => void copyClientId(row.original.id)}
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
      createdAt: false,
      email: false,
      phone: false,
      sourceHash: false,
      sourceUpdatedAt: false,
      synchronizedAt: false,
      updatedAt: false,
    },
  })

  const cityItems = useMemo(() => {
    const items = new Map<
      string,
      { group: string; label: string; value: string }
    >()

    for (const client of clients) {
      const value = getCityFilterValue(client)

      if (!items.has(value)) {
        items.set(value, {
          group: client.state,
          label: client.city,
          value,
        })
      }
    }

    return Array.from(items.values()).sort(
      (left, right) =>
        left.group.localeCompare(right.group, "pt-BR") ||
        left.label.localeCompare(right.label, "pt-BR"),
    )
  }, [clients])

  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const client of clients) {
      const value = getCityFilterValue(client)
      counts[value] = (counts[value] ?? 0) + 1
    }

    return counts
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
    const search = normalizeSearch(state.globalFilter)

    return clients.filter((client) => {
      if (cityFilter && getCityFilterValue(client) !== cityFilter) {
        return false
      }

      if (!search) {
        return true
      }

      return normalizeSearch(
        [
          client.id,
          client.name,
          client.tradeName,
          client.taxId,
          client.email,
          client.phone,
          client.city,
          client.state,
          client.stateCode,
          client.personActiveStatus,
          client.financialBlockStatus,
        ].join(" "),
      ).includes(search)
    })
  }, [cityFilter, clients, state.globalFilter])

  const sortedClients = useMemo(() => {
    const sort = state.sorting[0]

    if (!sort) {
      return filteredClients
    }

    return [...filteredClients].sort((left, right) => {
      const leftValue = left[sort.id as keyof Client]
      const rightValue = right[sort.id as keyof Client]
      const comparison = String(leftValue ?? "").localeCompare(
        String(rightValue ?? ""),
        "pt-BR",
        { numeric: true, sensitivity: "base" },
      )

      return sort.desc ? -comparison : comparison
    })
  }, [filteredClients, state.sorting])

  const paginatedClients = useMemo(() => {
    const start = state.pagination.pageIndex * state.pagination.pageSize
    return sortedClients.slice(start, start + state.pagination.pageSize)
  }, [sortedClients, state.pagination.pageIndex, state.pagination.pageSize])

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
        hasActiveFilters={state.hasFilters || Boolean(cityFilter)}
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
          counts={cityCounts}
          items={cityItems}
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
            hasFilters={state.hasFilters || Boolean(cityFilter)}
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
