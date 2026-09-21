import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DataTableColumnHeader } from "./data-table-column-header"

describe("DataTableColumnHeader", () => {
  it("usa o título e o ícone como um único alvo de ordenação", async () => {
    const user = userEvent.setup()
    const toggleSorting = vi.fn()

    render(
      <DataTableColumnHeader
        title="Nome"
        column={{
          getCanSort: () => true,
          getIsSorted: () => false,
          getToggleSortingHandler: () => toggleSorting,
        }}
      />,
    )

    const button = screen.getByRole("button", { name: "Ordenar por Nome" })
    expect(button).toHaveTextContent("Nome")

    await user.click(screen.getByText("Nome"))
    expect(toggleSorting).toHaveBeenCalledOnce()
  })

  it("não cria controle interativo para uma coluna não ordenável", () => {
    render(
      <DataTableColumnHeader
        title="Ações"
        column={{
          getCanSort: () => false,
          getIsSorted: () => false,
          getToggleSortingHandler: () => undefined,
        }}
      />,
    )

    expect(screen.getByText("Ações")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
