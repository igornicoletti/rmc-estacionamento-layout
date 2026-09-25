import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { DataTableExport } from "@/components/data-table/components/data-table-export"

describe("DataTableExport", () => {
  it("encaminha a ação de exportação", async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()

    renderWithProviders(<DataTableExport onExport={onExport} />)

    await user.click(
      screen.getByRole("button", { name: "Exportar CSV" }),
    )

    expect(onExport).toHaveBeenCalledOnce()
  })

  it("exibe a orientação por tooltip quando a exportação está disponível", async () => {
    const user = userEvent.setup()

    renderWithProviders(<DataTableExport onExport={vi.fn()} />)

    const exportButton = screen.getByRole("button", {
      name: "Exportar CSV",
    })

    await user.hover(exportButton)

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Exportar dados filtrados em CSV",
    )
  })

  it("mantém a orientação por tooltip quando a exportação está desabilitada", async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()

    renderWithProviders(
      <DataTableExport disabled onExport={onExport} />,
    )

    const exportButton = screen.getByRole("button", {
      name: "Exportar CSV",
    })
    const tooltipTrigger = exportButton.parentElement

    expect(exportButton).toBeDisabled()
    expect(tooltipTrigger).not.toBeNull()

    if (!tooltipTrigger) {
      throw new Error("Trigger do tooltip não encontrado.")
    }

    await user.hover(tooltipTrigger)

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Exportar dados filtrados em CSV",
    )
    expect(onExport).not.toHaveBeenCalled()
  })
})
