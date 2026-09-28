import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import {
  DataTableRowActions,
  DataTableRowActionsHeader,
} from "@/components/data-table/data-table-row-actions"
import { createDataTableColumnHelper } from "@/components/data-table/data-table-features"
import type { ClientVehicle } from "@/features/clients/vehicles/contracts/vehicles-types"
import { formatErpName } from "@/features/clients/presentation/clients-format"
import {
  formatLicensePlate,
  formatVehicleDescription,
} from "@/features/clients/vehicles/presentation/vehicles-format"

interface ClientVehiclesTableColumnActions {
  onCopyData: (vehicle: ClientVehicle) => Promise<void>
}

const columnHelper = createDataTableColumnHelper<ClientVehicle>()

export function createVehiclesTableColumns(
  showDriver: boolean,
  { onCopyData }: ClientVehiclesTableColumnActions,
) {
  return columnHelper.columns([
    columnHelper.accessor("id", {
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue()}</span>
      ),
      enableHiding: true,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Código do veículo" />
      ),
      meta: { visibilityLabel: "Código do veículo" },
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
    columnHelper.accessor(
      (vehicle) => `${vehicle.plate} ${formatLicensePlate(vehicle.plate)}`,
      {
        id: "plate",
        cell: ({ row }) => formatLicensePlate(row.original.plate),
        enableHiding: false,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Placa" />
        ),
        meta: { visibilityLabel: "Placa" },
      },
    ),
    columnHelper.accessor("description", {
      cell: ({ getValue }) => formatVehicleDescription(getValue()),
      enableHiding: true,
      enableSorting: true,
      filterFn: "equals",
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
    columnHelper.display({
      cell: ({ row }) => (
        <DataTableRowActions
          accessibleLabel={`Ações do veículo ${formatLicensePlate(row.original.plate)}`}
          onCopyData={() => onCopyData(row.original)}
        />
      ),
      enableHiding: false,
      header: DataTableRowActionsHeader,
      id: "actions",
    }),
  ])
}
