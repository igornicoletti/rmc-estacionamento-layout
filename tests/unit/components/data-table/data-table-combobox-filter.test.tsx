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
        ariaLabel="status"
        counts={{ active: 5, invited: 0, suspended: 2 }}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="Selecione"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "status" }))

    expect(await screen.findAllByRole("option")).toHaveLength(2)
  })

  it("preserva a opção selecionada mesmo sem faceta disponível", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="status"
        counts={{ active: 5, invited: 3, suspended: 0 }}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="Selecione"
        value="suspended"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "status" }))

    const options = await screen.findAllByRole("option")
    const selectedOptions = options.filter(
      (option) => option.getAttribute("aria-selected") === "true",
    )

    expect(options).toHaveLength(3)
    expect(selectedOptions).toHaveLength(1)
  })

  it("encaminha seleção e limpeza", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="status"
        clearAriaLabel="Limpar filtro"
        counts={{ active: 5, invited: 3, suspended: 2 }}
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder="Selecione"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "status" }))
    const options = await screen.findAllByRole("option")
    const targetOption = options[2]

    if (!targetOption) {
      throw new Error("Opção esperada não encontrada.")
    }

    await user.click(targetOption)

    expect(onValueChange).toHaveBeenLastCalledWith("suspended")

    rerender(
      <DataTableComboboxFilter
        ariaLabel="status"
        clearAriaLabel="Limpar filtro"
        counts={{ active: 5, invited: 3, suspended: 0 }}
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder="Selecione"
        value="suspended"
      />,
    )

    await user.click(screen.getByRole("button", { name: "Limpar filtro" }))

    expect(onValueChange).toHaveBeenLastCalledWith(undefined)
  })

  it("não expõe opções quando nenhuma faceta está disponível", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="status"
        counts={{ active: 0, invited: 0, suspended: 0 }}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="Selecione"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "status" }))

    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })
})
