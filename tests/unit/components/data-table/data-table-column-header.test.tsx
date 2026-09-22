import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header"

describe("DataTableColumnHeader", () => {
  it("usa um único controle para ordenar", async () => {
    const user = userEvent.setup()
    const toggleSorting = vi.fn()

    render(
      <DataTableColumnHeader
        title="field"
        column={{
          getCanSort: () => true,
          getIsSorted: () => false,
          getToggleSortingHandler: () => toggleSorting,
        }}
      />,
    )

    await user.click(screen.getByRole("button"))

    expect(toggleSorting).toHaveBeenCalledOnce()
  })

  it("não cria controle interativo para coluna não ordenável", () => {
    render(
      <DataTableColumnHeader
        title="field"
        column={{
          getCanSort: () => false,
          getIsSorted: () => false,
          getToggleSortingHandler: () => undefined,
        }}
      />,
    )

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
