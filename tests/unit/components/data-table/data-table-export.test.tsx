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

  it("bloqueia a exportação quando desabilitado", async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()

    renderWithProviders(
      <DataTableExport disabled onExport={onExport} />,
    )

    const exportButton = screen.getByRole("button", {
      name: "Exportar CSV",
    })

    expect(exportButton).toBeDisabled()
    await user.click(exportButton)
    expect(onExport).not.toHaveBeenCalled()
  })
})
