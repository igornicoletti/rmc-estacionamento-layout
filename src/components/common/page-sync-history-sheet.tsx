import { HistoryIcon } from "lucide-react"

import { AppEmpty } from "@/components/common/app-empty"
import { AppSheet } from "@/components/common/app-sheet"
import { pageSyncHistoryCopy } from "@/components/common/page-sync-history.copy"
import { PageSyncHistoryItem } from "@/components/common/page-sync-history-item"
import type { PageSyncHistoryExecution } from "@/components/common/page-sync-history.types"
import { ItemGroup } from "@/components/ui/item"

interface PageSyncHistorySheetProps {
  executions: readonly PageSyncHistoryExecution[]
  onOpenChange: (open: boolean) => void
  open: boolean
  scopeLabel: string
}

export function PageSyncHistorySheet({
  executions,
  onOpenChange,
  open,
  scopeLabel,
}: PageSyncHistorySheetProps) {
  return (
    <AppSheet
      description={pageSyncHistoryCopy.description(scopeLabel)}
      onOpenChange={onOpenChange}
      open={open}
      size="wide"
      title={pageSyncHistoryCopy.title}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {pageSyncHistoryCopy.previewNotice}
      </p>

      {executions.length > 0 ? (
        <ItemGroup>
          {executions.map((execution) => (
            <PageSyncHistoryItem execution={execution} key={execution.id} />
          ))}
        </ItemGroup>
      ) : (
        <AppEmpty
          description={pageSyncHistoryCopy.empty.description}
          headingLevel={2}
          media={{ icon: HistoryIcon }}
          title={pageSyncHistoryCopy.empty.title}
        />
      )}
    </AppSheet>
  )
}
