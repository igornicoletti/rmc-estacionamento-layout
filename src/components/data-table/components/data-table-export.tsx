import { FileDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { dataTableCopy } from "@/components/data-table/data-table.copy"

interface DataTableExportProps {
  disabled?: boolean
  onExport: () => void
}

export function DataTableExport({
  disabled = false,
  onExport,
}: DataTableExportProps) {
  const exportButton = (
    <Button
      aria-label={dataTableCopy.export.trigger}
      disabled={disabled}
      onClick={onExport}
      size="icon"
      type="button"
      variant="outline"
    >
      <FileDownIcon aria-hidden="true" />
    </Button>
  )

  return (
    <Tooltip>
      {disabled ? (
        <TooltipTrigger render={<span className="inline-flex" />}>
          {exportButton}
        </TooltipTrigger>
      ) : (
        <TooltipTrigger render={exportButton} />
      )}
      <TooltipContent role="tooltip">
        {dataTableCopy.export.tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
