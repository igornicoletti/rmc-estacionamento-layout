import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header"
import {
  DataTableRowActions,
  DataTableRowActionsHeader,
} from "@/components/data-table/components/data-table-row-actions"
import { createServerTableHook } from "@/components/data-table/hooks/create-server-table-hook"
import type { ClientVehicle } from "@/pages/clients/model/client-vehicle"
import {
  formatDateTime,
  formatErpName,
  formatLicensePlate,
  formatVehicleDescription,
  formatYesNo,
} from "@/pages/clients/model/client-presentation"

interface ClientVehiclesTableColumnActions {
  onCopyData: (vehicle: ClientVehicle) => void
  onDetails: (vehicle: ClientVehicle) => void
}

export const clientVehiclesTableApi =
  createServerTableHook<Record<string, never>>()
const columnHelper = clientVehiclesTableApi.createAppColumnHelper<ClientVehicle>()

export function createClientVehiclesTableColumns(
  showDriver: boolean,
  { onCopyData, onDetails }: ClientVehiclesTableColumnActions,
) {
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
    columnHelper.display({
      cell: ({ row }) => (
        <DataTableRowActions
          accessibleLabel={`Ações do veículo ${formatLicensePlate(row.original.plate)}`}
          onCopyData={() => onCopyData(row.original)}
          onDetails={() => onDetails(row.original)}
        />
      ),
      enableHiding: false,
      header: DataTableRowActionsHeader,
      id: "actions",
    }),
  ])
}
