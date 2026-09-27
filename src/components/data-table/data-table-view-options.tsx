import { Columns3Icon } from "lucide-react"

import { dataTableCopy } from "@/components/data-table/data-table.copy"
import type { DataTableColumnMeta } from "@/components/data-table/data-table-features"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface HideableColumn {
  id: string
  columnDef: { meta?: DataTableColumnMeta }
  getCanHide: () => boolean
  getIsVisible: () => boolean
  toggleVisibility: (visible?: boolean) => void
}

export function DataTableViewOptions({ table }: { table: { getAllLeafColumns: () => HideableColumn[] } }) {
  const labeled = table.getAllLeafColumns().filter((column) => column.columnDef.meta?.visibilityLabel)
  const hideable = labeled.filter((column) => column.getCanHide())
  if (hideable.length === 0) return null

  const visibleCount = labeled.filter((column) => column.getIsVisible()).length
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger render={<DropdownMenuTrigger render={<Button aria-label={dataTableCopy.columns.trigger} size="icon" variant="outline" />} />}>
          <Columns3Icon aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent role="tooltip">{dataTableCopy.columns.tooltip}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{dataTableCopy.columns.label}</DropdownMenuLabel>
          {hideable.map((column) => {
            const label = column.columnDef.meta?.visibilityLabel
            if (!label) throw new Error(`A coluna ocultável "${column.id}" precisa de meta.visibilityLabel.`)
            const lastVisible = column.getIsVisible() && visibleCount === 1
            return (
              <DropdownMenuCheckboxItem
                aria-label={lastVisible ? `${label}, ${dataTableCopy.columns.lastVisible}` : label}
                checked={column.getIsVisible()}
                closeOnClick={false}
                disabled={lastVisible}
                key={column.id}
                onCheckedChange={(checked) => column.toggleVisibility(checked)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
