import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { PageSyncHistorySheet } from "@/components/common/page-sync-history-sheet"
import { unitSyncHistoryFixture } from "@/pages/units/data/unit-sync-history.fixture"

describe("PageSyncHistorySheet", () => {
  it("exibe as execuções com os três estados previstos", () => {
    renderWithProviders(
      <PageSyncHistorySheet
        executions={unitSyncHistoryFixture}
        onOpenChange={vi.fn()}
        open
        scopeLabel="Unidades"
      />,
    )

    const dialog = screen.getByRole("dialog", {
      name: "Histórico de sincronização",
    })

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
        executions={unitSyncHistoryFixture}
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
      await within(dialog).findByText("demo-unit-sync-002"),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText("2 registros não puderam ser atualizados."),
    ).toBeInTheDocument()
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
