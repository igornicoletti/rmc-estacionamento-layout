import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

describe("DataTableToolbar", () => {
  it("renderiza ações e limpa filtros ativos", async () => {
    const user = userEvent.setup()
    const onClearFilters = vi.fn()
    render(
      <DataTableToolbar
        actions={<span>Ação auxiliar</span>}
        hasActiveFilters
        onClearFilters={onClearFilters}
      >
        <span>Filtros</span>
      </DataTableToolbar>,
    )

    expect(screen.getByText("Ação auxiliar")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }))
    expect(onClearFilters).toHaveBeenCalledOnce()
  })

  it("não reserva controles opcionais quando estão ausentes", () => {
    const { container } = render(
      <DataTableToolbar hasActiveFilters={false} onClearFilters={vi.fn()}>
        <span>Filtros</span>
      </DataTableToolbar>,
    )

    expect(screen.queryByRole("button", { name: "Limpar filtros" }))
      .not.toBeInTheDocument()
    expect(container.querySelector('[data-slot="data-table-toolbar-actions"]'))
      .not.toBeInTheDocument()
  })
})
