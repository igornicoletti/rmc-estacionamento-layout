import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

describe("DataTableToolbar", () => {
  it("encaminha a limpeza de filtros ativos", async () => {
    const user = userEvent.setup()
    const onClearFilters = vi.fn()

    render(
      <DataTableToolbar
        actions={<span />}
        hasActiveFilters
        onClearFilters={onClearFilters}
      >
        <span />
      </DataTableToolbar>,
    )

    await user.click(screen.getByRole("button"))

    expect(onClearFilters).toHaveBeenCalledOnce()
  })

  it("não cria controle de limpeza sem filtros ativos", () => {
    render(
      <DataTableToolbar hasActiveFilters={false} onClearFilters={vi.fn()}>
        <span />
      </DataTableToolbar>,
    )

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
