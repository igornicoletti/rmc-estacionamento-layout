import { DownloadIcon } from "lucide-react"

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
  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            aria-label={dataTableCopy.export.trigger}
            disabled
            onClick={onExport}
            size="icon"
            type="button"
            variant="outline"
          >
            <DownloadIcon aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent role="tooltip">
          {dataTableCopy.export.tooltip}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={dataTableCopy.export.trigger}
            onClick={onExport}
            size="icon"
            type="button"
            variant="outline"
          />
        }
      >
        <DownloadIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent role="tooltip">
        {dataTableCopy.export.tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
