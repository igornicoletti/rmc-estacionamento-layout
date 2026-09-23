export type PageSyncHistoryStatus = "success" | "partial" | "error"

export type PageSyncHistoryTrigger = "automatic" | "manual"

export interface PageSyncHistoryExecution {
  failedCount: number
  finishedAt: string
  id: string
  message?: string
  processedCount: number
  requestedBy?: string
  startedAt: string
  status: PageSyncHistoryStatus
  succeededCount: number
  trigger: PageSyncHistoryTrigger
}
