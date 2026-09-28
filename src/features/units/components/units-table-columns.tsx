import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import {
  DataTableRowActions,
  DataTableRowActionsHeader,
} from "@/components/data-table/data-table-row-actions"
import { createDataTableColumnHelper } from "@/components/data-table/data-table-features"
import type { Unit } from "@/features/units/contracts/units-types"
import {
  formatUnitCity,
  formatUnitDateTime,
  formatUnitName,
  formatUnitOptionalText,
} from "@/features/units/presentation/units-format"

interface UnitsTableColumnActions {
  onCopyData: (unit: Unit) => Promise<void>
}

const columnHelper = createDataTableColumnHelper<Unit>()

export function createUnitsTableColumns({
  onCopyData,
}: UnitsTableColumnActions) {
  return columnHelper.columns([
    columnHelper.accessor("id", {
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Código" />
      ),
      meta: { visibilityLabel: "Código" },
    }),
    columnHelper.accessor("tradeName", {
      cell: ({ getValue }) => formatUnitName(getValue()),
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome fantasia" />
      ),
      meta: { visibilityLabel: "Nome fantasia" },
    }),
    columnHelper.accessor("legalName", {
      cell: ({ getValue }) => formatUnitName(getValue()),
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Razão social" />
      ),
      meta: { visibilityLabel: "Razão social" },
    }),
    columnHelper.accessor("cnpj", {
      enableHiding: true,
      enableSorting: false,
      header: "CNPJ",
      meta: { visibilityLabel: "CNPJ" },
    }),
    columnHelper.accessor("brand", {
      cell: ({ getValue }) => formatUnitName(getValue()),
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bandeira" />
      ),
      meta: { visibilityLabel: "Bandeira" },
    }),
    columnHelper.accessor("brandCode", {
      enableHiding: true,
      enableSorting: false,
      header: "Código da bandeira",
      meta: { visibilityLabel: "Código da bandeira" },
    }),
    columnHelper.accessor("city", {
      cell: ({ getValue, row }) =>
        `${formatUnitCity(getValue())} — ${row.original.stateCode}`,
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cidade/UF" />
      ),
      meta: { visibilityLabel: "Cidade/UF" },
    }),
    columnHelper.accessor((unit) => `${unit.stateCode}:${unit.city}`, {
      id: "cityFacet",
      enableGlobalFilter: false,
      enableHiding: true,
      enableSorting: false,
      filterFn: "equals",
      header: "Cidade do filtro",
    }),
    columnHelper.accessor("state", {
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estado" />
      ),
      meta: { visibilityLabel: "Estado" },
    }),
    columnHelper.accessor("cityCode", {
      enableHiding: true,
      enableSorting: false,
      header: "Código da cidade",
      meta: { visibilityLabel: "Código da cidade" },
    }),
    columnHelper.accessor("coordinates", {
      cell: ({ getValue }) => formatUnitOptionalText(getValue()),
      enableHiding: true,
      enableSorting: false,
      header: "Coordenadas",
      meta: { visibilityLabel: "Coordenadas" },
    }),
    columnHelper.accessor("synchronizedAt", {
      cell: ({ getValue }) => formatUnitDateTime(getValue()),
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sincronização" />
      ),
      meta: { visibilityLabel: "Sincronização" },
    }),
    columnHelper.accessor("createdAt", {
      cell: ({ getValue }) => formatUnitDateTime(getValue()),
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Criação" />
      ),
      meta: { visibilityLabel: "Criação" },
    }),
    columnHelper.accessor("updatedAt", {
      cell: ({ getValue }) => formatUnitDateTime(getValue()),
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Atualização" />
      ),
      meta: { visibilityLabel: "Atualização" },
    }),
    columnHelper.display({
      cell: ({ row }) => (
        <DataTableRowActions
          accessibleLabel={`Ações da unidade ${formatUnitName(row.original.tradeName)}`}
          onCopyData={() => onCopyData(row.original)}
        />
      ),
      enableHiding: false,
      header: DataTableRowActionsHeader,
      id: "actions",
    }),
  ])
}
