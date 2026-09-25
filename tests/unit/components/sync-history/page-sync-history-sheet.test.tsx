import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { PageSyncHistorySheet } from "@/components/sync-history/page-sync-history-sheet"
import type { PageSyncHistoryExecution } from "@/components/sync-history/page-sync-history.types"

const executions = [
  {
    failedCount: 0,
    finishedAt: "2026-09-23T14:08:07-03:00",
    id: "test-sync-success",
    processedCount: 18,
    requestedBy: "Pessoa de teste",
    startedAt: "2026-09-23T14:08:01-03:00",
    status: "success",
    succeededCount: 18,
    trigger: "manual",
  },
  {
    failedCount: 2,
    finishedAt: "2026-09-23T11:30:15-03:00",
    id: "test-sync-partial",
    message: "mensagem parcial",
    processedCount: 18,
    startedAt: "2026-09-23T11:30:08-03:00",
    status: "partial",
    succeededCount: 16,
    trigger: "automatic",
  },
  {
    failedCount: 18,
    finishedAt: "2026-09-23T08:45:16-03:00",
    id: "test-sync-error",
    message: "mensagem de erro",
    processedCount: 18,
    requestedBy: "Pessoa de teste",
    startedAt: "2026-09-23T08:45:09-03:00",
    status: "error",
    succeededCount: 0,
    trigger: "manual",
  },
] as const satisfies readonly PageSyncHistoryExecution[]

function renderHistory(
  executionsOverride: readonly PageSyncHistoryExecution[] = executions,
) {
  renderWithProviders(
    <PageSyncHistorySheet
      executions={executionsOverride}
      onOpenChange={vi.fn()}
      open
      scopeLabel="scope"
    />,
  )

  return screen.getByRole("dialog")
}

describe("PageSyncHistorySheet", () => {
  it("renderiza uma entrada por execução", () => {
    const dialog = renderHistory()

    expect(within(dialog).getByRole("list")).toBeInTheDocument()
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(
      executions.length,
    )
  })

  it("revela os detalhes da execução pelo disclosure", async () => {
    const user = userEvent.setup()
    const dialog = renderHistory()
    const items = within(dialog).getAllByRole("listitem")
    const target = items[1]

    if (!target) {
      throw new Error("Execução alvo não encontrada.")
    }

    const disclosure = within(target).getByRole("button")

    expect(disclosure).toHaveAttribute("aria-expanded", "false")

    await user.click(disclosure)

    expect(disclosure).toHaveAttribute("aria-expanded", "true")
    expect(target.querySelector("dl")).not.toBeNull()
  })

  it("não renderiza lista quando não há execuções", () => {
    const dialog = renderHistory([])

    expect(within(dialog).queryByRole("list")).not.toBeInTheDocument()
  })
})
