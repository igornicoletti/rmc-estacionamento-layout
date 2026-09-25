import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { DataTableViewOptions } from "@/components/data-table/components/data-table-view-options"

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
              columnDef: { meta: { visibilityLabel: "A" } },
              getCanHide: () => true,
              getIsVisible: () => true,
              toggleVisibility: toggleTitle,
            },
            {
              id: "status",
              columnDef: { meta: { visibilityLabel: "B" } },
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

    const trigger = screen.getByRole("button")

    expect(trigger).toHaveAccessibleName()

    await user.click(trigger)

    const options = await screen.findAllByRole("menuitemcheckbox")

    expect(options).toHaveLength(2)
    expect(options[0]).toHaveAttribute("aria-disabled", "true")
    expect(toggleTitle).not.toHaveBeenCalled()

    await user.click(options[1])

    expect(toggleStatus).toHaveBeenCalledWith(true)
  })

  it("permite ocultar a última coluna opcional quando há identidade fixa", async () => {
    const user = userEvent.setup()
    const toggleEmail = vi.fn()

    renderWithProviders(
      <DataTableViewOptions
        table={{
          getAllLeafColumns: () => [
            {
              id: "name",
              columnDef: { meta: { visibilityLabel: "A" } },
              getCanHide: () => false,
              getIsVisible: () => true,
              toggleVisibility: vi.fn(),
            },
            {
              id: "email",
              columnDef: { meta: { visibilityLabel: "B" } },
              getCanHide: () => true,
              getIsVisible: () => true,
              toggleVisibility: toggleEmail,
            },
          ],
        }}
      />,
    )

    await user.click(screen.getByRole("button"))

    const options = await screen.findAllByRole("menuitemcheckbox")

    expect(options).toHaveLength(1)

    const [option] = options

    if (!option) {
      throw new Error("Opção ocultável não encontrada.")
    }

    expect(option).not.toHaveAttribute("aria-disabled", "true")

    await user.click(option)

    expect(toggleEmail).toHaveBeenCalledWith(false)
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

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
