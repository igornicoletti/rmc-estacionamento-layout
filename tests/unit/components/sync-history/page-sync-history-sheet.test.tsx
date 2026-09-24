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
    id: "test-sync-error",
    message: "A execução não conseguiu concluir a atualização dos registros.",
    processedCount: 18,
    requestedBy: "Pessoa de teste",
    startedAt: "2026-09-23T08:45:09-03:00",
    status: "error",
    succeededCount: 0,
    trigger: "manual",
  },
] as const satisfies readonly PageSyncHistoryExecution[]

describe("PageSyncHistorySheet", () => {
  it("exibe as execuções com os três estados previstos", () => {
    renderWithProviders(
      <PageSyncHistorySheet
        executions={executions}
        onOpenChange={vi.fn()}
        open
        scopeLabel="Unidades"
      />,
    )

    const dialog = screen.getByRole("dialog", {
      name: "Histórico de sincronização",
    })

    expect(
      within(dialog).getByText("Dados demonstrativos para validação visual."),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole("list")).toBeInTheDocument()
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(3)
    expect(within(dialog).getByText("Sucesso")).toBeInTheDocument()
    expect(within(dialog).getByText("Parcial")).toBeInTheDocument()
    expect(within(dialog).getByText("Erro")).toBeInTheDocument()
  })

  it("revela os detalhes de uma execução pelo disclosure", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <PageSyncHistorySheet
        executions={executions}
        onOpenChange={vi.fn()}
        open
        scopeLabel="Unidades"
      />,
    )

    const dialog = screen.getByRole("dialog", {
      name: "Histórico de sincronização",
    })
    const detailButtons = within(dialog).getAllByRole("button", {
      name: /Exibir detalhes da sincronização/u,
    })

    await user.click(detailButtons[1])

    expect(
      await within(dialog).findByText("test-sync-partial"),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText("2 registros não puderam ser atualizados."),
    ).toBeInTheDocument()
    expect(within(dialog).getByText("Sistema")).toBeInTheDocument()
    expect(within(dialog).getByText("Processados")).toBeInTheDocument()
    expect(within(dialog).getByText("Concluídos")).toBeInTheDocument()
    expect(within(dialog).getByText("Falhas")).toBeInTheDocument()
  })

  it("usa o fallback vazio quando não há execuções", () => {
    renderWithProviders(
      <PageSyncHistorySheet
        executions={[]}
        onOpenChange={vi.fn()}
        open
        scopeLabel="Unidades"
      />,
    )

    expect(
      screen.getByText("Nenhuma sincronização registrada"),
    ).toBeInTheDocument()
  })
})
