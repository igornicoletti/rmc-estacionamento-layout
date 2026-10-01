import { DownloadIcon } from "lucide-react"

import { AppTooltipButton } from "@/components/app/app-tooltip-button"
import { dataTableContent } from "@/components/data-table/data-table-content"
import { dataTableNotify } from "@/components/data-table/data-table-notify"
import { notify } from "@/components/toast/toast-notify"

interface DataTableExportProps {
  disabled?: boolean
  onExport: () => void
}

export function DataTableExport({
  disabled = false,
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
    <AppTooltipButton
      disabled={disabled}
      icon={DownloadIcon}
      label={dataTableContent.export.trigger}
      onClick={exportData}
      tooltip={dataTableContent.export.tooltip}
    />
  )
}
