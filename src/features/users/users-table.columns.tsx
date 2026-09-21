import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import {
  DataTableRowActions,
  DataTableRowActionsHeader,
} from "@/components/data-table/data-table-row-actions"
import { Badge } from "@/components/ui/badge"

import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_VARIANTS,
} from "./users.constants"
import type { DemoUser } from "./users.schema"
import { createUsersColumnHelper } from "./users-table.features"

const columnHelper = createUsersColumnHelper<DemoUser>()
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

export const usersTableColumns = columnHelper.columns([
  columnHelper.accessor("name", {
    meta: { visibilityLabel: "Nome" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
  }),
  columnHelper.accessor("email", {
    meta: { visibilityLabel: "E-mail" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="E-mail" />,
  }),
  columnHelper.accessor("role", {
    meta: { visibilityLabel: "Perfil" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Perfil" />,
    cell: ({ getValue }) => USER_ROLE_LABELS[getValue()],
  }),
  columnHelper.accessor("status", {
    meta: { visibilityLabel: "Status" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ getValue }) => {
      const status = getValue()
      return (
        <Badge variant={USER_STATUS_VARIANTS[status]}>
          {USER_STATUS_LABELS[status]}
        </Badge>
      )
    },
  }),
  columnHelper.accessor("lastAccessAt", {
    meta: { visibilityLabel: "Último acesso" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Último acesso" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      return value ? dateFormatter.format(new Date(value)) : "Nunca"
    },
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    header: DataTableRowActionsHeader,
    cell: ({ row, table }) => (
      <DataTableRowActions
        accessibleLabel={`Ações de ${row.original.name}`}
        copyLabel="Copiar e-mail"
        onView={() => table.options.meta?.onView(row.original)}
        onCopy={() => table.options.meta?.onCopyEmail(row.original)}
      />
    ),
  }),
])
