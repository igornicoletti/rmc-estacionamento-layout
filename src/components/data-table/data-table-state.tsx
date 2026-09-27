import { useEffect, useState } from "react"
import { CircleAlertIcon, SearchXIcon } from "lucide-react"

import { AppEmpty } from "@/components/app/app-empty"
import { dataTableCopy } from "@/components/data-table/data-table.copy"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { TableCell, TableRow } from "@/components/ui/table"

export function DataTableLazyFallback() {
  return (
    <div aria-live="polite" className="flex flex-col gap-4" data-slot="data-table-lazy-fallback" role="status">
      <span className="sr-only">{dataTableCopy.loading}</span>
      <Skeleton className="h-9 w-full max-w-80" />
      <Skeleton className="h-72 w-full" />
    </div>
  )
}

export function DataTableSkeletonRows({ columns, rows }: { columns: number; rows: number }) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <TableRow aria-hidden="true" className="h-14 animate-in fade-in-0 duration-150 [animation-delay:150ms] fill-mode-[backwards]" key={`skeleton-${rowIndex}`}>
      {Array.from({ length: columns }, (_, columnIndex) => (
        <TableCell key={`${rowIndex}-${columnIndex}`}><Skeleton className="h-5 w-full max-w-32" /></TableCell>
      ))}
    </TableRow>
  ))
}

interface DataTableEmptyProps {
  emptyDescription?: string
  emptyTitle?: string
  hasFilters: boolean
  onClearFilters: () => void
}

export function DataTableEmpty({ emptyDescription = dataTableCopy.empty.defaultDescription, emptyTitle = dataTableCopy.empty.defaultTitle, hasFilters, onClearFilters }: DataTableEmptyProps) {
  return (
    <AppEmpty
      description={hasFilters ? dataTableCopy.empty.filteredDescription : emptyDescription}
      headingLevel={3}
      media={{ icon: SearchXIcon }}
      title={hasFilters ? dataTableCopy.empty.filteredTitle : emptyTitle}
    >
      {hasFilters ? <Button onClick={onClearFilters} size="sm" variant="outline">{dataTableCopy.empty.clearFilters}</Button> : null}
    </AppEmpty>
  )
}

export function DataTableError({ description = dataTableCopy.error.defaultDescription, onRetry, title = dataTableCopy.error.defaultTitle }: { description?: string; onRetry: () => void; title?: string }) {
  return (
    <Alert variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      <AlertAction><Button onClick={onRetry} size="sm" variant="outline">{dataTableCopy.error.retry}</Button></AlertAction>
    </Alert>
  )
}

export function DataTableUpdating({ active }: { active: boolean }) {
  if (!active) return null
  return <UpdatingIndicator />
}

function UpdatingIndicator() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300)
    return () => window.clearTimeout(timer)
  }, [])
  if (!visible) return null
  return <div aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Spinner aria-hidden="true" />{dataTableCopy.updating}</div>
}
