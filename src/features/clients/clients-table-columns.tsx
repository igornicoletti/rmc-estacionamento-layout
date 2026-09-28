import { Link } from "react-router"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import {
  DataTableRowActions,
  DataTableRowActionsHeader,
} from "@/components/data-table/data-table-row-actions"
import { createDataTableColumnHelper } from "@/components/data-table/data-table-features"
import { appRoutes } from "@/app/app-routes"
import { ClientsEmailCell } from "@/features/clients/clients-email-cell"
import type { Client } from "@/features/clients/clients-types"
import { formatCityName, formatDate, formatDateTime, formatErpName, formatPhone, formatYesNo } from "@/features/clients/clients-format"


interface ClientsTableColumnActions {
  onCopyData: (client: Client) => Promise<void>
}

const columnHelper = createDataTableColumnHelper<Client>()

export function createClientsTableColumns({
  onCopyData,
}: ClientsTableColumnActions) {
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
    columnHelper.accessor("name", {
      cell: ({ getValue, row }) => (
        <Link
          className="block max-w-64 truncate font-medium underline-offset-4 hover:underline"
          to={appRoutes.clientDetails.path(row.original.id)}
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
      cell: ({ getValue }) => <ClientsEmailCell value={getValue()} />,
      enableHiding: true,
      enableSorting: false,
      header: "E-mail",
      meta: { visibilityLabel: "E-mail" },
    }),
    columnHelper.accessor((client) => `${client.phone} ${formatPhone(client.phone)}`, {
      id: "phone",
      cell: ({ row }) => formatPhone(row.original.phone),
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
    columnHelper.accessor((client) => `${client.stateCode}:${client.city}`, {
      id: "cityFacet",
      enableGlobalFilter: false,
      enableSorting: false,
      filterFn: "equals",
      header: "Cidade do filtro",
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
          onCopyData={() => onCopyData(row.original)}
        />
      ),
      enableHiding: false,
      header: DataTableRowActionsHeader,
      id: "actions",
    }),
  ])
}
