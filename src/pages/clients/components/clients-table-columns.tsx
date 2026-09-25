import { Link } from "react-router"

import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header"
import {
  DataTableRowActions,
  DataTableRowActionsHeader,
} from "@/components/data-table/components/data-table-row-actions"
import { createDataTableHook } from "@/components/data-table/hooks/create-data-table-hook"
import { getClientDetailsPath } from "@/pages/clients/client-routes"
import { ClientEmailCell } from "@/pages/clients/components/client-email-cell"
import type { Client } from "@/pages/clients/model/client"
import {
  formatCityName,
  formatDate,
  formatDateTime,
  formatErpName,
  formatPhone,
  formatYesNo,
} from "@/pages/clients/model/client-presentation"

interface ClientsTableColumnActions {
  onCopyData: (client: Client) => void
  onDetails: (client: Client) => void
}

export const clientsTableApi =
  createDataTableHook<Record<string, never>>()
const columnHelper = clientsTableApi.createAppColumnHelper<Client>()

export function createClientsTableColumns({
  onCopyData,
  onDetails,
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
          onDetails={() => onDetails(row.original)}
        />
      ),
      enableHiding: false,
      header: DataTableRowActionsHeader,
      id: "actions",
    }),
  ])
}
