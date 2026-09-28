import type { ReactNode } from "react"
import { XIcon } from "lucide-react"

import { dataTableContent } from "@/components/data-table/data-table-content"
import { AppIconButton } from "@/components/app/app-icon-button"

interface DataTableToolbarProps {
  actions?: ReactNode
  activeFilterCount: number
  children: ReactNode
  onClearFilters: () => void
}

export function DataTableToolbar({
  actions,
  activeFilterCount,
  children,
  onClearFilters,
}: DataTableToolbarProps) {
  return (
    <div className="@container/toolbar min-w-0" data-slot="data-table-toolbar">
      <div className="flex min-w-0 flex-col gap-3 @sm/toolbar:flex-row @sm/toolbar:flex-wrap @sm/toolbar:items-center">
        {children}
        {activeFilterCount >= 2 ? (
          <AppIconButton
            icon={XIcon}
            label={dataTableContent.empty.clearFilters}
            data-testid="data-table-clear-filters"
            onClick={onClearFilters}
            size="icon"
            variant="outline"
          />
        ) : null}
        {actions ? (
          <div
            className="flex w-full min-w-0 items-center justify-end gap-3 @sm/toolbar:ml-auto @sm/toolbar:w-auto"
            data-slot="data-table-toolbar-actions"
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}
