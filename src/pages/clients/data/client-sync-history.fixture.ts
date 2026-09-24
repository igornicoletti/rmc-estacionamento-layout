import type { PageSyncHistoryExecution } from "@/components/sync-history/page-sync-history.types"

export const clientSyncHistoryFixture = [
  {
    failedCount: 0,
    finishedAt: "2026-09-23T14:32:26-03:00",
    id: "demo-client-sync-003",
    processedCount: 24,
    requestedBy: "Usuário de demonstração",
    startedAt: "2026-09-23T14:32:14-03:00",
    status: "success",
    succeededCount: 24,
    trigger: "manual",
  },
  {
    failedCount: 2,
    finishedAt: "2026-09-23T12:01:31-03:00",
    id: "demo-client-sync-002",
    message: "2 registros não puderam ser atualizados.",
    processedCount: 24,
    startedAt: "2026-09-23T12:01:18-03:00",
    status: "partial",
    succeededCount: 22,
    trigger: "automatic",
  },
  {
    failedCount: 24,
    finishedAt: "2026-09-23T09:16:19-03:00",
    id: "demo-client-sync-001",
    message: "A execução não conseguiu concluir a atualização dos registros.",
    processedCount: 24,
    requestedBy: "Usuário de demonstração",
    startedAt: "2026-09-23T09:16:08-03:00",
    status: "error",
    succeededCount: 0,
    trigger: "manual",
  },
] as const satisfies readonly PageSyncHistoryExecution[]
