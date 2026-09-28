import { DownloadIcon } from "lucide-react"

import { dataTableContent } from "@/components/data-table/data-table-content"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function DataTableExport({ disabled = false, onExport }: { disabled?: boolean; onExport: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger render={disabled ? <span className="inline-flex" /> : <Button aria-label={dataTableContent.export.trigger} onClick={onExport} size="icon" variant="outline" />}>
        {disabled ? <Button aria-label={dataTableContent.export.trigger} disabled size="icon" variant="outline"><DownloadIcon aria-hidden="true" /></Button> : <DownloadIcon aria-hidden="true" />}
      </TooltipTrigger>
      <TooltipContent role="tooltip">{dataTableContent.export.tooltip}</TooltipContent>
    </Tooltip>
  )
}
