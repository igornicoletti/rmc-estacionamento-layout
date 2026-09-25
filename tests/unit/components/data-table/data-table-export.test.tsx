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

    const button = screen.getByRole("button")

    expect(button).toHaveAccessibleName()

    await user.click(button)

    expect(onExport).toHaveBeenCalledOnce()
  })

  it("exibe orientação quando a exportação está disponível", async () => {
    const user = userEvent.setup()

    renderWithProviders(<DataTableExport onExport={vi.fn()} />)

    const button = screen.getByRole("button")

    await user.hover(button)

    expect(await screen.findByRole("tooltip")).toBeVisible()
  })

  it("mantém a orientação quando a exportação está desabilitada", async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()

    renderWithProviders(<DataTableExport disabled onExport={onExport} />)

    const button = screen.getByRole("button")
    const tooltipTrigger = button.parentElement

    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleName()
    expect(tooltipTrigger).not.toBeNull()

    if (!tooltipTrigger) {
      throw new Error("Trigger do tooltip não encontrado.")
    }

    await user.hover(tooltipTrigger)

    expect(await screen.findByRole("tooltip")).toBeVisible()
    expect(onExport).not.toHaveBeenCalled()
  })
})
