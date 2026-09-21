import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/render"

import { DataTableComboboxFilter } from "./data-table-combobox-filter"

const ITEMS = [
  { label: "Ativo", value: "active" },
  { label: "Convidado", value: "invited" },
  { label: "Suspenso", value: "suspended" },
] as const

describe("DataTableComboboxFilter", () => {
  it("exibe badges e omite valores indisponíveis", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="Filtrar por status"
        counts={{ active: 5, invited: 0, suspended: 2 }}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="Todos os status"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "Filtrar por status" }))

    const active = screen.getByRole("option", { name: /Ativo/ })
    expect(within(active).getByText("5")).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Convidado/ })).not.toBeInTheDocument()
    expect(within(screen.getByRole("option", { name: /Suspenso/ })).getByText("2"))
      .toBeInTheDocument()
  })

  it("usa a seleção e a limpeza nativas do combobox", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="Filtrar por status"
        counts={{ active: 5, invited: 3, suspended: 2 }}
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder="Todos os status"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "Filtrar por status" }))
    await user.click(screen.getByRole("option", { name: /Suspenso/ }))
    expect(onValueChange).toHaveBeenLastCalledWith("suspended")

    rerender(
      <DataTableComboboxFilter
        ariaLabel="Filtrar por status"
        counts={{ active: 5, invited: 3, suspended: 0 }}
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder="Todos os status"
        value="suspended"
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Limpar filtrar por status" }),
    )
    expect(onValueChange).toHaveBeenLastCalledWith(undefined)
  })

  it("usa o fallback vazio do combobox", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="Filtrar por status"
        counts={{ active: 5, invited: 3, suspended: 2 }}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="Todos os status"
      />,
    )

    const filter = screen.getByRole("combobox", { name: "Filtrar por status" })
    await user.click(filter)
    await user.type(filter, "inexistente")

    expect(screen.getByText("Nenhum resultado.")).toBeInTheDocument()
  })

  it("mantém todas as opções disponíveis antes de receber as facetas", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="Filtrar por status"
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="Todos os status"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "Filtrar por status" }))

    expect(screen.getAllByRole("option")).toHaveLength(3)
  })
})
