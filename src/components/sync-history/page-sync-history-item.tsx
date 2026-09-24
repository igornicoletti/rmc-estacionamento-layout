import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleXIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { pageSyncHistoryCopy } from "@/components/sync-history/page-sync-history.copy"
import type {
  PageSyncHistoryExecution,
  PageSyncHistoryStatus,
} from "@/components/sync-history/page-sync-history.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

function formatDuration(startedAt: string, finishedAt: string) {
  const durationSeconds = Math.max(
    0,
    Math.round(
      (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000,
    ),
  )

  const hours = Math.floor(durationSeconds / 3600)
  const minutes = Math.floor((durationSeconds % 3600) / 60)
  const seconds = durationSeconds % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`
  }

  return `${seconds} s`
}

function SyncHistoryStatusBadge({
  status,
}: {
  status: PageSyncHistoryStatus
}) {
  if (status === "success") {
    return (
      <Badge
        className="border-success/30 bg-success/10 text-foreground [&>svg]:text-success"
        variant="outline"
      >
        <CircleCheckIcon aria-hidden="true" data-icon="inline-start" />
        {pageSyncHistoryCopy.status.success}
      </Badge>
    )
  }

  if (status === "partial") {
    return (
      <Badge
        className="border-warning/40 bg-warning/15 text-foreground [&>svg]:text-warning"
        variant="outline"
      >
        <TriangleAlertIcon aria-hidden="true" data-icon="inline-start" />
        {pageSyncHistoryCopy.status.partial}
      </Badge>
    )
  }

  return (
    <Badge
      className="border-destructive/30 bg-destructive/10 text-foreground [&>svg]:text-destructive"
      variant="outline"
    >
      <CircleXIcon aria-hidden="true" data-icon="inline-start" />
      {pageSyncHistoryCopy.status.error}
    </Badge>
  )
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium sm:text-right">{value}</dd>
    </div>
  )
}

export function PageSyncHistoryItem({
  execution,
}: {
  execution: PageSyncHistoryExecution
}) {
  const startedAt = formatDateTime(execution.startedAt)
  const finishedAt = formatDateTime(execution.finishedAt)
  const duration = formatDuration(execution.startedAt, execution.finishedAt)
  const triggerLabel = pageSyncHistoryCopy.trigger[execution.trigger]
  const requestedBy =
    execution.trigger === "manual"
      ? execution.requestedBy
      : pageSyncHistoryCopy.actor.system
  const summary =
    execution.trigger === "manual"
      ? `${triggerLabel} por ${execution.requestedBy} · ${duration}`
      : `${triggerLabel} · ${duration}`

  return (
    <Collapsible role="listitem">
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>
            <time dateTime={execution.startedAt}>{startedAt}</time>
          </ItemTitle>
          <ItemDescription>{summary}</ItemDescription>
        </ItemContent>

        <ItemActions>
          <SyncHistoryStatusBadge status={execution.status} />
          <CollapsibleTrigger
            render={
              <Button
                aria-label={`${pageSyncHistoryCopy.actions.showDetails}: ${startedAt}`}
                size="icon-sm"
                type="button"
                variant="ghost"
              />
            }
          >
            <ChevronDownIcon aria-hidden="true" />
          </CollapsibleTrigger>
        </ItemActions>

        <CollapsibleContent className="basis-full">
          <Separator className="my-3" />
          <dl className="grid gap-3">
            <DetailRow
              label={pageSyncHistoryCopy.fields.startedAt}
              value={startedAt}
            />
            <DetailRow
              label={pageSyncHistoryCopy.fields.finishedAt}
              value={finishedAt}
            />
            <DetailRow
              label={pageSyncHistoryCopy.fields.duration}
              value={duration}
            />
            <DetailRow
              label={pageSyncHistoryCopy.fields.trigger}
              value={triggerLabel}
            />
            <DetailRow
              label={pageSyncHistoryCopy.fields.requestedBy}
              value={requestedBy}
            />
            <DetailRow
              label={pageSyncHistoryCopy.fields.processedCount}
              value={execution.processedCount}
            />
            <DetailRow
              label={pageSyncHistoryCopy.fields.succeededCount}
              value={execution.succeededCount}
            />
            <DetailRow
              label={pageSyncHistoryCopy.fields.failedCount}
              value={execution.failedCount}
            />
            <DetailRow
              label={pageSyncHistoryCopy.fields.executionId}
              value={execution.id}
            />
            {execution.message ? (
              <DetailRow
                label={pageSyncHistoryCopy.fields.message}
                value={execution.message}
              />
            ) : null}
          </dl>
        </CollapsibleContent>
      </Item>
    </Collapsible>
  )
}
