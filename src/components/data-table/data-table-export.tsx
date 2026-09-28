import { DownloadIcon } from "lucide-react"

import { AppIconButton } from "@/components/app/app-icon-button"
import { dataTableContent } from "@/components/data-table/data-table-content"
import { dataTableNotify } from "@/components/data-table/data-table-notify"
import { notify } from "@/components/toast/toast-notify"

interface DataTableExportProps {
  disabled?: boolean
  disabledReason?: string
  onExport: () => void
}

export function DataTableExport({
  disabled = false,
  disabledReason = dataTableContent.export.empty,
  onExport,
}: DataTableExportProps) {
  function exportData() {
    try {
      onExport()
    } catch {
      notify(dataTableNotify.exportFailed)
    }
  }
  return (
    <AppIconButton
      disabled={disabled}
      icon={DownloadIcon}
      label={dataTableContent.export.trigger}
      onClick={exportData}
      tooltip={disabled ? disabledReason : dataTableContent.export.tooltip}
    />
  )
}
