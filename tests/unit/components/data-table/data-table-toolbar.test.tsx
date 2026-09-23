import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DataTableToolbar } from "@/components/data-table/components/data-table-toolbar"

describe("DataTableToolbar", () => {
  it("encaminha a limpeza de filtros ativos", async () => {
    const user = userEvent.setup()
    const onClearFilters = vi.fn()

    render(
      <DataTableToolbar
        actions={<span />}
        activeFilterCount={2}
        onClearFilters={onClearFilters}
      >
        <span />
      </DataTableToolbar>,
    )

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }))

    expect(onClearFilters).toHaveBeenCalledOnce()
  })

  it.each([0, 1])("não cria limpeza global com %i filtro ativo", (activeFilterCount) => {
    render(
      <DataTableToolbar activeFilterCount={activeFilterCount} onClearFilters={vi.fn()}>
        <span />
      </DataTableToolbar>,
    )

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
