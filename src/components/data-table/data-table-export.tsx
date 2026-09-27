import { DownloadIcon } from "lucide-react"

import { dataTableCopy } from "@/components/data-table/data-table.copy"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function DataTableExport({ disabled = false, onExport }: { disabled?: boolean; onExport: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger render={disabled ? <span className="inline-flex" /> : <Button aria-label={dataTableCopy.export.trigger} onClick={onExport} size="icon" variant="outline" />}>
        {disabled ? <Button aria-label={dataTableCopy.export.trigger} disabled size="icon" variant="outline"><DownloadIcon aria-hidden="true" /></Button> : <DownloadIcon aria-hidden="true" />}
      </TooltipTrigger>
      <TooltipContent role="tooltip">{dataTableCopy.export.tooltip}</TooltipContent>
    </Tooltip>
  )
}
