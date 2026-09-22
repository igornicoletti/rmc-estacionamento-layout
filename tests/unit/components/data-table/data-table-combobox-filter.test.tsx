import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { DataTableComboboxFilter } from "@/components/data-table/components/data-table-combobox-filter"

const ITEMS = [
  { label: "A", value: "active" },
  { label: "B", value: "invited" },
  { label: "C", value: "suspended" },
] as const

describe("DataTableComboboxFilter", () => {
  it("omite opções indisponíveis quando recebe facetas", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="filter"
        counts={{ active: 5, invited: 0, suspended: 2 }}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="placeholder"
      />,
    )

    await user.click(screen.getByRole("combobox"))

    expect(screen.getAllByRole("option")).toHaveLength(2)
  })

  it("encaminha seleção e limpeza", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="filter"
        counts={{ active: 5, invited: 3, suspended: 2 }}
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder="placeholder"
      />,
    )

    await user.click(screen.getByRole("combobox"))
    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(3)

    await user.click(options[2])
    expect(onValueChange).toHaveBeenLastCalledWith("suspended")

    rerender(
      <DataTableComboboxFilter
        ariaLabel="filter"
        counts={{ active: 5, invited: 3, suspended: 0 }}
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder="placeholder"
        value="suspended"
      />,
    )

    await user.click(screen.getByRole("button", { name: "Limpar filter" }))
    expect(onValueChange).toHaveBeenLastCalledWith(undefined)
  })

  it("mantém as opções antes de receber facetas", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="filter"
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="placeholder"
      />,
    )

    await user.click(screen.getByRole("combobox"))

    expect(await screen.findAllByRole("option")).toHaveLength(3)
  })
})
