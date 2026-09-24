import type { PageSyncHistoryExecution } from "@/components/sync-history/page-sync-history.types"

export const unitSyncHistoryFixture = [
  {
    failedCount: 0,
    finishedAt: "2026-09-23T14:08:07-03:00",
    id: "demo-unit-sync-003",
    processedCount: 18,
    requestedBy: "Usuário de demonstração",
    startedAt: "2026-09-23T14:08:01-03:00",
    status: "success",
    succeededCount: 18,
    trigger: "manual",
  },
  {
    failedCount: 2,
    finishedAt: "2026-09-23T11:30:15-03:00",
    id: "demo-unit-sync-002",
    message: "2 registros não puderam ser atualizados.",
    processedCount: 18,
    startedAt: "2026-09-23T11:30:08-03:00",
    status: "partial",
    succeededCount: 16,
    trigger: "automatic",
  },
  {
    failedCount: 18,
    finishedAt: "2026-09-23T08:45:16-03:00",
    id: "demo-unit-sync-001",
    message: "A execução não conseguiu concluir a atualização dos registros.",
    processedCount: 18,
    requestedBy: "Usuário de demonstração",
    startedAt: "2026-09-23T08:45:09-03:00",
    status: "error",
    succeededCount: 0,
    trigger: "manual",
  },
] as const satisfies readonly PageSyncHistoryExecution[]
