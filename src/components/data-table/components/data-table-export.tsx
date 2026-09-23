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
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={dataTableCopy.export.trigger}
            disabled={disabled}
            onClick={onExport}
            size="icon"
            type="button"
            variant="outline"
          />
        }
      >
        <FileDownIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent role="tooltip">
        {dataTableCopy.export.tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
