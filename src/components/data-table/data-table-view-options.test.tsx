import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/render"

import { DataTableViewOptions } from "./data-table-view-options"

describe("DataTableViewOptions", () => {
  it("impede ocultar a última coluna de dados visível", async () => {
    const user = userEvent.setup()
    const toggleTitle = vi.fn()
    const toggleStatus = vi.fn()

    renderWithProviders(
      <DataTableViewOptions
        table={{
          getAllLeafColumns: () => [
            {
              id: "title",
              columnDef: { meta: { visibilityLabel: "Título" } },
              getCanHide: () => true,
              getIsVisible: () => true,
              toggleVisibility: toggleTitle,
            },
            {
              id: "status",
              columnDef: { meta: { visibilityLabel: "Status" } },
              getCanHide: () => true,
              getIsVisible: () => false,
              toggleVisibility: toggleStatus,
            },
            {
              id: "actions",
              columnDef: {},
              getCanHide: () => false,
              getIsVisible: () => true,
              toggleVisibility: vi.fn(),
            },
          ],
        }}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Colunas" }))

    const lastVisibleColumn = await screen.findByRole("menuitemcheckbox", {
      name: "Título, última coluna visível",
    })
    expect(lastVisibleColumn).toHaveAttribute("aria-disabled", "true")
    expect(toggleTitle).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "Status" }),
    )
    expect(toggleStatus).toHaveBeenCalledWith(true)
    expect(
      screen.getByRole("menuitemcheckbox", {
        name: "Título, última coluna visível",
      }),
    ).toBeVisible()
  })

  it("não renderiza o controle sem colunas ocultáveis", () => {
    renderWithProviders(
      <DataTableViewOptions
        table={{
          getAllLeafColumns: () => [
            {
              id: "actions",
              columnDef: {},
              getCanHide: () => false,
              getIsVisible: () => true,
              toggleVisibility: vi.fn(),
            },
          ],
        }}
      />,
    )

    expect(screen.queryByRole("button", { name: "Colunas" })).not.toBeInTheDocument()
  })
})
