import { Columns3Icon } from "lucide-react"

import { dataTableContent } from "@/components/data-table/data-table-content"
import type { DataTableColumnMeta } from "@/components/data-table/data-table-features"
import { AppIconButton } from "@/components/app/app-icon-button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HideableColumn {
  id: string
  columnDef: { meta?: DataTableColumnMeta }
  getCanHide: () => boolean
  getIsVisible: () => boolean
  toggleVisibility: (visible?: boolean) => void
}

export interface DataTableViewOptionsProps {
  table: { getAllLeafColumns: () => HideableColumn[] }
}

export function DataTableViewOptions({ table }: DataTableViewOptionsProps) {
  const labeled = table
    .getAllLeafColumns()
    .filter((column) => column.columnDef.meta?.visibilityLabel)
  const hideable = labeled.filter((column) => column.getCanHide())
  if (hideable.length === 0) return null

  const visibleCount = labeled.filter((column) => column.getIsVisible()).length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <AppIconButton
            icon={Columns3Icon}
            label={dataTableContent.columns.trigger}
            tooltip={dataTableContent.columns.tooltip}
          />
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {dataTableContent.columns.label}
          </DropdownMenuLabel>
          {hideable.map((column) => {
            const label = column.columnDef.meta?.visibilityLabel
            if (!label)
              throw new Error(
                `A coluna ocultável "${column.id}" precisa de meta.visibilityLabel.`,
              )
            const lastVisible = column.getIsVisible() && visibleCount === 1
            return (
              <DropdownMenuCheckboxItem
                aria-label={
                  lastVisible
                    ? `${label}, ${dataTableContent.columns.lastVisible}`
                    : label
                }
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
