import { CopyIcon, EyeIcon, MoreHorizontalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { dataTableCopy } from "@/components/data-table/data-table.copy"

interface DataTableRowActionsProps {
  accessibleLabel: string
  onCopyData: () => void
  onDetails?: () => void
}

export function DataTableRowActions({
  accessibleLabel,
  onCopyData,
  onDetails,
}: DataTableRowActionsProps) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="data-table-row-actions-trigger"
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={accessibleLabel}
        >
          <MoreHorizontalIcon data-icon="inline-start" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{dataTableCopy.rowActions.label}</DropdownMenuLabel>
            {onDetails ? (
              <DropdownMenuItem
                data-slot="data-table-row-action-details"
                onClick={onDetails}
              >
                <EyeIcon aria-hidden="true" />
                {dataTableCopy.rowActions.details}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              data-slot="data-table-row-action-copy"
              onClick={onCopyData}
            >
              <CopyIcon aria-hidden="true" />
              {dataTableCopy.rowActions.copyData}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function DataTableRowActionsHeader() {
  return <span className="sr-only">{dataTableCopy.rowActions.label}</span>
}
