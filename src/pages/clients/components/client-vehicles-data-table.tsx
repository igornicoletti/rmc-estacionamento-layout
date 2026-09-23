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
import {
  normalizeSearchText,
  paginateRows,
  sortRows,
} from "@/pages/clients/lib/client-table-utils"
import type { ClientVehicle } from "@/pages/clients/model/client-vehicle"
import {
  formatDateTime,
  formatErpName,
  formatLicensePlate,
  formatVehicleDescription,
  formatYesNo,
} from "@/pages/clients/model/client-presentation"

interface ClientVehiclesDataTableProps {
  clientId: string
}

const EMPTY_CLIENT_VEHICLES: ClientVehicle[] = []
const tableApi = createServerTableHook<Record<string, never>>()
const columnHelper = tableApi.createAppColumnHelper<ClientVehicle>()

function createColumns(showDriver: boolean) {
  return columnHelper.columns([
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
    columnHelper.accessor("clientId", {
      enableHiding: true,
      enableSorting: false,
      header: "Código do cliente",
      meta: { visibilityLabel: "Código do cliente" },
    }),
    columnHelper.accessor("clientName", {
      cell: ({ getValue }) => formatErpName(getValue()),
      enableHiding: true,
      enableSorting: false,
      header: "Nome do cliente",
      meta: { visibilityLabel: "Nome do cliente" },
    }),
    columnHelper.accessor("clientTradeName", {
      cell: ({ getValue }) => formatErpName(getValue()),
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
      cell: ({ getValue }) => formatLicensePlate(getValue()),
      enableHiding: false,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Placa" />
      ),
      meta: { visibilityLabel: "Placa" },
    }),
    columnHelper.accessor("description", {
      cell: ({ getValue }) => formatVehicleDescription(getValue()),
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
            cell: ({ getValue }) => formatErpName(getValue()),
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
      cell: ({ getValue }) => formatYesNo(getValue()),
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
      cell: ({ getValue }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDateTime(getValue())}
        </span>
      ),
      enableHiding: true,
      enableSorting: false,
      header: "Atualização na origem",
      meta: { visibilityLabel: "Atualização na origem" },
    }),
    columnHelper.accessor("synchronizedAt", {
      cell: ({ getValue }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDateTime(getValue())}
        </span>
      ),
      enableHiding: true,
      enableSorting: false,
      header: "Sincronização",
      meta: { visibilityLabel: "Sincronização" },
    }),
    columnHelper.accessor("createdAt", {
      cell: ({ getValue }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDateTime(getValue())}
        </span>
      ),
      enableHiding: true,
      enableSorting: false,
      header: "Criação",
      meta: { visibilityLabel: "Criação" },
    }),
    columnHelper.accessor("updatedAt", {
      cell: ({ getValue }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatDateTime(getValue())}
        </span>
      ),
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
  const allVehicles = vehiclesQuery.data ?? EMPTY_CLIENT_VEHICLES
  const [descriptionFilter, setDescriptionFilter] = useState<string>()
  const state = useDataTableState({
    initialColumnVisibility: {
      clientActiveWithin120Days: false,
      clientId: false,
      clientName: false,
      clientTaxId: false,
      clientTradeName: false,
      sourceHash: false,
      sourceUpdatedAt: false,
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

  const descriptionFacet = useMemo(() => {
    const descriptions = new Set<string>()
    const counts: Record<string, number> = {}

    for (const vehicle of clientVehicles) {
      if (vehicle.description === "") {
        continue
      }

      const value = formatVehicleDescription(vehicle.description)
      descriptions.add(value)
      counts[value] = (counts[value] ?? 0) + 1
    }

    return {
      counts,
      items: Array.from(descriptions)
        .sort((left, right) => left.localeCompare(right, "pt-BR"))
        .map((value) => ({ label: value, value })),
    }
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
    const search = normalizeSearchText(state.globalFilter)

    return clientVehicles.filter((vehicle) => {
      if (
        descriptionFilter &&
        formatVehicleDescription(vehicle.description) !== descriptionFilter
      ) {
        return false
      }

      if (!search) {
        return true
      }

      return normalizeSearchText(
        [
          vehicle.id,
          vehicle.plate,
          formatLicensePlate(vehicle.plate),
          vehicle.description,
          formatVehicleDescription(vehicle.description),
          showDriver ? vehicle.driverName : "",
          showDriver ? formatErpName(vehicle.driverName) : "",
        ].join(" "),
      ).includes(search)
    })
  }, [
    clientVehicles,
    descriptionFilter,
    showDriver,
    state.globalFilter,
  ])

  const sortedVehicles = useMemo(
    () =>
      sortRows(filteredVehicles, state.sorting, (vehicle, columnId) => {
        if (columnId === "description") {
          return formatVehicleDescription(vehicle.description)
        }

        if (columnId === "plate") {
          return formatLicensePlate(vehicle.plate)
        }

        if (columnId === "driverName") {
          return formatErpName(vehicle.driverName)
        }

        return vehicle[columnId as keyof ClientVehicle]
      }),
    [filteredVehicles, state.sorting],
  )

  const paginatedVehicles = useMemo(
    () => paginateRows(sortedVehicles, state.pagination),
    [sortedVehicles, state.pagination],
  )

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

  const hasActiveFilters = state.hasFilters || Boolean(descriptionFilter)

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
        hasActiveFilters={hasActiveFilters}
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
        {descriptionFacet.items.length > 1 ? (
          <DataTableComboboxFilter
            ariaLabel="Filtrar por veículo"
            clearAriaLabel="Limpar filtro de veículo"
            counts={descriptionFacet.counts}
            items={descriptionFacet.items}
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
            hasFilters={hasActiveFilters}
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
