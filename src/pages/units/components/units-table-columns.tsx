import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header"
import { DataTableRowActions, DataTableRowActionsHeader } from "@/components/data-table/components/data-table-row-actions"
import { createServerTableHook } from "@/components/data-table/hooks/create-server-table-hook"
import { toast } from "@/components/ui/toast"
import type { Unit } from "@/pages/units/model/unit"
import { unitsCopy } from "@/pages/units/units.copy"

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" })
export const unitsTableApi = createServerTableHook<Record<string, never>>()
const columnHelper = unitsTableApi.createAppColumnHelper<Unit>()

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

async function copyUnitId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    toast.add({ description: id, title: unitsCopy.actions.copySuccessTitle, type: "success" })
  } catch {
    toast.add({ description: unitsCopy.actions.copyErrorDescription, title: unitsCopy.actions.copyErrorTitle, type: "error" })
  }
}

export const unitsTableColumns = columnHelper.columns([
  columnHelper.accessor("id", { enableHiding: true, enableSorting: true, header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />, meta: { visibilityLabel: "Código" } }),
  columnHelper.accessor("tradeName", { enableHiding: true, enableSorting: true, header: ({ column }) => <DataTableColumnHeader column={column} title="Nome fantasia" />, meta: { visibilityLabel: "Nome fantasia" } }),
  columnHelper.accessor("legalName", { enableHiding: true, enableSorting: true, header: ({ column }) => <DataTableColumnHeader column={column} title="Razão social" />, meta: { visibilityLabel: "Razão social" } }),
  columnHelper.accessor("cnpj", { enableHiding: true, enableSorting: false, header: "CNPJ", meta: { visibilityLabel: "CNPJ" } }),
  columnHelper.accessor("brand", { enableHiding: true, enableSorting: true, header: ({ column }) => <DataTableColumnHeader column={column} title="Bandeira" />, meta: { visibilityLabel: "Bandeira" } }),
  columnHelper.accessor("brandCode", { enableHiding: true, enableSorting: false, header: "Código da bandeira", meta: { visibilityLabel: "Código da bandeira" } }),
  columnHelper.accessor("city", { cell: ({ getValue, row }) => `${getValue()} — ${row.original.stateCode}`, enableHiding: true, enableSorting: true, header: ({ column }) => <DataTableColumnHeader column={column} title="Cidade/UF" />, meta: { visibilityLabel: "Cidade/UF" } }),
  columnHelper.accessor("state", { enableHiding: true, enableSorting: true, header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />, meta: { visibilityLabel: "Estado" } }),
  columnHelper.accessor("cityCode", { enableHiding: true, enableSorting: false, header: "Código da cidade", meta: { visibilityLabel: "Código da cidade" } }),
  columnHelper.accessor("coordinates", { cell: ({ getValue }) => getValue() ?? unitsCopy.notInformed, enableHiding: true, enableSorting: false, header: "Coordenadas", meta: { visibilityLabel: "Coordenadas" } }),
  columnHelper.accessor("synchronizedAt", { cell: ({ getValue }) => formatDateTime(getValue()), enableHiding: true, enableSorting: true, header: ({ column }) => <DataTableColumnHeader column={column} title="Sincronização" />, meta: { visibilityLabel: "Sincronização" } }),
  columnHelper.accessor("createdAt", { cell: ({ getValue }) => formatDateTime(getValue()), enableHiding: true, enableSorting: true, header: ({ column }) => <DataTableColumnHeader column={column} title="Criação" />, meta: { visibilityLabel: "Criação" } }),
  columnHelper.accessor("updatedAt", { cell: ({ getValue }) => formatDateTime(getValue()), enableHiding: true, enableSorting: true, header: ({ column }) => <DataTableColumnHeader column={column} title="Atualização" />, meta: { visibilityLabel: "Atualização" } }),
  columnHelper.display({
    cell: ({ row }) => <DataTableRowActions accessibleLabel={`Ações da unidade ${row.original.tradeName}`} copyLabel={unitsCopy.actions.copyLabel} onCopy={() => void copyUnitId(row.original.id)} />,
    enableHiding: false,
    header: DataTableRowActionsHeader,
    id: "actions",
  }),
])
