import { CopyIcon, EyeIcon, MoreHorizontalIcon } from "lucide-react"

import { dataTableCopy } from "@/components/data-table/data-table.copy"
import { dataTableNotify } from "@/components/data-table/data-table-notify"
import { notify } from "@/components/toast/toast-notify"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DataTableRowActionsProps {
  accessibleLabel: string
  onCopyData: () => Promise<void>
  onDetails?: () => void
}

export function DataTableRowActions({ accessibleLabel, onCopyData, onDetails }: DataTableRowActionsProps) {
  async function copyData() {
    try {
      await onCopyData()
      notify(dataTableNotify.rowCopied)
    } catch {
      notify(dataTableNotify.rowCopyFailed)
    }
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={accessibleLabel} data-testid="data-table-row-actions-trigger" render={<Button size="icon-sm" variant="ghost" />}>
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{dataTableCopy.rowActions.label}</DropdownMenuLabel>
            {onDetails ? <DropdownMenuItem onClick={onDetails}><EyeIcon aria-hidden="true" />{dataTableCopy.rowActions.details}</DropdownMenuItem> : null}
            <DropdownMenuItem data-testid="data-table-row-action-copy" onClick={() => void copyData()}><CopyIcon aria-hidden="true" />{dataTableCopy.rowActions.copyData}</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function DataTableRowActionsHeader() {
  return <span className="sr-only">{dataTableCopy.rowActions.label}</span>
}
