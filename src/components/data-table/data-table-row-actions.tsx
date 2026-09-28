import { CopyIcon, EyeIcon, MoreHorizontalIcon } from "lucide-react"

import { dataTableContent } from "@/components/data-table/data-table-content"
import { dataTableNotify } from "@/components/data-table/data-table-notify"
import { notify } from "@/components/toast/toast-notify"
import { AppIconButton } from "@/components/app/app-icon-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableRowActionsProps {
  accessibleLabel: string
  onCopyData: () => Promise<void>
  onDetails?: () => void
}

export function DataTableRowActions({
  accessibleLabel,
  onCopyData,
  onDetails,
}: DataTableRowActionsProps) {
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
        <DropdownMenuTrigger
          render={
            <AppIconButton
              data-testid="data-table-row-actions-trigger"
              icon={MoreHorizontalIcon}
              label={accessibleLabel}
              size="icon-sm"
              tooltip={dataTableContent.rowActions.label}
              variant="ghost"
            />
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {dataTableContent.rowActions.label}
            </DropdownMenuLabel>
            {onDetails ? (
              <DropdownMenuItem onClick={onDetails}>
                <EyeIcon aria-hidden="true" />
                {dataTableContent.rowActions.details}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              data-testid="data-table-row-action-copy"
              onClick={() => void copyData()}
            >
              <CopyIcon aria-hidden="true" />
              {dataTableContent.rowActions.copyData}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function DataTableRowActionsHeader() {
  return <span className="sr-only">{dataTableContent.rowActions.label}</span>
}
