import type { ReactNode } from "react"
import { XIcon } from "lucide-react"

import { dataTableContent } from "@/components/data-table/data-table-content"
import { Button } from "@/components/ui/button"

interface DataTableToolbarProps {
  actions?: ReactNode
  activeFilterCount: number
  children: ReactNode
  onClearFilters: () => void
}

export function DataTableToolbar({ actions, activeFilterCount, children, onClearFilters }: DataTableToolbarProps) {
  return (
    <div className="@container/toolbar min-w-0" data-slot="data-table-toolbar">
      <div className="flex min-w-0 flex-col gap-3 @sm/toolbar:flex-row @sm/toolbar:flex-wrap @sm/toolbar:items-center">
        {children}
        {activeFilterCount >= 2 ? (
          <Button aria-label={dataTableContent.empty.clearFilters} data-testid="data-table-clear-filters" onClick={onClearFilters} size="icon" variant="outline">
            <XIcon aria-hidden="true" />
          </Button>
        ) : null}
        {actions ? <div className="flex w-full min-w-0 items-center justify-end gap-3 @sm/toolbar:ml-auto @sm/toolbar:w-auto" data-slot="data-table-toolbar-actions">{actions}</div> : null}
      </div>
    </div>
  )
}
