export type PageSyncHistoryStatus = "success" | "partial" | "error"

interface PageSyncHistoryExecutionBase {
  failedCount: number
  finishedAt: string
  id: string
  message?: string
  processedCount: number
  startedAt: string
  status: PageSyncHistoryStatus
  succeededCount: number
}

interface PageSyncHistoryManualExecution {
  requestedBy: string
  trigger: "manual"
}

interface PageSyncHistoryAutomaticExecution {
  requestedBy?: never
  trigger: "automatic"
}

export type PageSyncHistoryExecution = PageSyncHistoryExecutionBase &
  (PageSyncHistoryManualExecution | PageSyncHistoryAutomaticExecution)

export type PageSyncHistoryTrigger = PageSyncHistoryExecution["trigger"]
