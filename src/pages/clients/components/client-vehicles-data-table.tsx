import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { DataTable } from "@/components/data-table/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header"
import { DataTableComboboxFilter } from "@/components/data-table/components/data-table-combobox-filter"
import { DataTablePagination } from "@/components/data-table/components/data-table-pagination"
import { DataTableRoot } from "@/components/data-table/components/data-table-root"
import { DataTableSearch } from "@/components/data-table/components/data-table-search"
import {
  DataTableEmpty,
  DataTableError,
} from "@/components/data-table/components/data-table-state"
import { DataTableToolbar } from "@/components/data-table/components/data-table-toolbar"
import { DataTableViewOptions } from "@/components/data-table/components/data-table-view-options"
import { createServerTableHook } from "@/components/data-table/hooks/create-server-table-hook"
import { useDataTableState } from "@/components/data-table/hooks/use-data-table-state"
import {
  clientMockQueryKeys,
  loadMockClientVehicles,
} from "@/pages/clients/data/client-mock-data"
import type { ClientVehicle } from "@/pages/clients/model/client-vehicle"

interface ClientVehiclesDataTableProps {
  clientId: string
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const tableApi = createServerTableHook<Record<string, never>>()
const columnHelper = tableApi.createAppColumnHelper<ClientVehicle>()

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "—"
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("pt-BR")
}

function createColumns(showDriver: boolean) {
  return columnHelper.columns([
    columnHelper.accessor("id", {
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Código" />
      ),
      meta: { visibilityLabel: "Código" },
    }),
    columnHelper.accessor("clientId", {
      enableHiding: true,
      enableSorting: false,
      header: "Código do cliente",
      meta: { visibilityLabel: "Código do cliente" },
    }),
    columnHelper.accessor("clientName", {
      enableHiding: true,
      enableSorting: false,
      header: "Nome do cliente",
      meta: { visibilityLabel: "Nome do cliente" },
    }),
    columnHelper.accessor("clientTradeName", {
      enableHiding: true,
      enableSorting: false,
      header: "Nome fantasia",
      meta: { visibilityLabel: "Nome fantasia" },
    }),
    columnHelper.accessor("clientTaxId", {
      enableHiding: true,
      enableSorting: false,
      header: "CPF/CNPJ",
      meta: { visibilityLabel: "CPF/CNPJ" },
    }),
    columnHelper.accessor("plate", {
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Placa" />
      ),
      meta: { visibilityLabel: "Placa" },
    }),
    columnHelper.accessor("description", {
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Veículo" />
      ),
      meta: { visibilityLabel: "Veículo" },
    }),
    ...(showDriver
      ? [
          columnHelper.accessor("driverName", {
            enableHiding: true,
            enableSorting: true,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Motorista" />
            ),
            meta: { visibilityLabel: "Motorista" },
          }),
        ]
      : []),
    columnHelper.accessor("clientActiveWithin120Days", {
      cell: ({ getValue }) => (getValue() ? "Sim" : "Não"),
      enableHiding: true,
      enableSorting: false,
      header: "Cliente ativo em 120 dias",
      meta: { visibilityLabel: "Cliente ativo em 120 dias" },
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
  ])
}

export function ClientVehiclesDataTable({
  clientId,
}: ClientVehiclesDataTableProps) {
  const vehiclesQuery = useQuery({
    queryKey: clientMockQueryKeys.vehicles,
    queryFn: loadMockClientVehicles,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const allVehicles = vehiclesQuery.data ?? []
  const [descriptionFilter, setDescriptionFilter] = useState<string>()
  const state = useDataTableState({
    initialColumnVisibility: {
      clientActiveWithin120Days: false,
      clientId: false,
      clientName: false,
      clientTaxId: false,
      clientTradeName: false,
      createdAt: false,
      sourceHash: false,
      sourceUpdatedAt: false,
      synchronizedAt: false,
      updatedAt: false,
    },
  })

  const clientVehicles = useMemo(
    () => allVehicles.filter((vehicle) => vehicle.clientId === clientId),
    [allVehicles, clientId],
  )
  const showDriver = useMemo(
    () => clientVehicles.some((vehicle) => vehicle.driverName !== ""),
    [clientVehicles],
  )
  const columns = useMemo(() => createColumns(showDriver), [showDriver])

  const descriptionItems = useMemo(() => {
    const descriptions = new Set<string>()

    for (const vehicle of clientVehicles) {
      if (vehicle.description !== "") {
        descriptions.add(vehicle.description)
      }
    }

    return Array.from(descriptions)
      .sort((left, right) => left.localeCompare(right, "pt-BR"))
      .map((value) => ({ label: value, value }))
  }, [clientVehicles])

  const descriptionCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const vehicle of clientVehicles) {
      if (vehicle.description !== "") {
        counts[vehicle.description] = (counts[vehicle.description] ?? 0) + 1
      }
    }

    return counts
  }, [clientVehicles])

  const handleDescriptionFilterChange = (value: string | undefined) => {
    setDescriptionFilter(value)
    state.onPaginationChange((current) => ({ ...current, pageIndex: 0 }))
  }

  const clearFilters = () => {
    state.clearFilters()
    setDescriptionFilter(undefined)
  }

  const filteredVehicles = useMemo(() => {
    const search = normalizeSearch(state.globalFilter)

    return clientVehicles.filter((vehicle) => {
      if (descriptionFilter && vehicle.description !== descriptionFilter) {
        return false
      }

      if (!search) {
        return true
      }

      return normalizeSearch(
        [
          vehicle.id,
          vehicle.plate,
          vehicle.description,
          showDriver ? vehicle.driverName : "",
        ].join(" "),
      ).includes(search)
    })
  }, [
    clientVehicles,
    descriptionFilter,
    showDriver,
    state.globalFilter,
  ])

  const sortedVehicles = useMemo(() => {
    const sort = state.sorting[0]

    if (!sort) {
      return filteredVehicles
    }

    return [...filteredVehicles].sort((left, right) => {
      const leftValue = left[sort.id as keyof ClientVehicle]
      const rightValue = right[sort.id as keyof ClientVehicle]
      const comparison = String(leftValue ?? "").localeCompare(
        String(rightValue ?? ""),
        "pt-BR",
        { numeric: true, sensitivity: "base" },
      )

      return sort.desc ? -comparison : comparison
    })
  }, [filteredVehicles, state.sorting])

  const paginatedVehicles = useMemo(() => {
    const start = state.pagination.pageIndex * state.pagination.pageSize
    return sortedVehicles.slice(start, start + state.pagination.pageSize)
  }, [sortedVehicles, state.pagination.pageIndex, state.pagination.pageSize])

  const table = tableApi.useAppTable({
    columns,
    data: paginatedVehicles,
    getRowId: (vehicle) => vehicle.id,
    onColumnVisibilityChange: state.setColumnVisibility,
    onPaginationChange: state.onPaginationChange,
    onSortingChange: state.onSortingChange,
    rowCount: filteredVehicles.length,
    state: {
      columnVisibility: state.columnVisibility,
      pagination: state.pagination,
      sorting: state.sorting,
    },
  })

  if (vehiclesQuery.isError) {
    return (
      <DataTableError
        description="Não foi possível carregar o mock local de veículos."
        onRetry={() => void vehiclesQuery.refetch()}
      />
    )
  }

  return (
    <DataTableRoot isBusy={vehiclesQuery.isPending || vehiclesQuery.isFetching}>
      <DataTableToolbar
        actions={<DataTableViewOptions table={table} />}
        hasActiveFilters={state.hasFilters || Boolean(descriptionFilter)}
        onClearFilters={clearFilters}
      >
        <DataTableSearch
          ariaLabel="Buscar veículos"
          onChange={state.handleSearchChange}
          onClear={state.clearSearch}
          onSubmit={state.submitSearch}
          placeholder={
            showDriver
              ? "Buscar por placa, veículo ou motorista..."
              : "Buscar por placa ou veículo..."
          }
          value={state.searchDraft}
        />
        {descriptionItems.length > 1 ? (
          <DataTableComboboxFilter
            ariaLabel="Filtrar por veículo"
            clearAriaLabel="Limpar filtro de veículo"
            counts={descriptionCounts}
            items={descriptionItems}
            onValueChange={handleDescriptionFilterChange}
            placeholder="Todos os veículos"
            searchAriaLabel="Buscar veículo"
            searchPlaceholder="Buscar veículo..."
            value={descriptionFilter}
          />
        ) : null}
      </DataTableToolbar>

      <DataTable
        caption="Veículos do cliente"
        emptyState={
          <DataTableEmpty
            emptyDescription="Nenhum veículo foi carregado para este cliente."
            emptyTitle="Nenhum veículo disponível"
            hasFilters={state.hasFilters || Boolean(descriptionFilter)}
            onClearFilters={clearFilters}
          />
        }
        isInitialLoading={vehiclesQuery.isPending}
        table={table}
      />

      {!vehiclesQuery.isPending ? (
        <DataTablePagination
          itemLabel={{ singular: "veículo", plural: "veículos" }}
          rowCount={filteredVehicles.length}
          table={table}
        />
      ) : null}
    </DataTableRoot>
  )
}
