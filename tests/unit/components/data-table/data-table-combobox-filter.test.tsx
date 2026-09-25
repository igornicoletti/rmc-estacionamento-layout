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

const GROUPED_ITEMS = [
  { group: "PR", label: "Curitiba", value: "pr-curitiba" },
  { group: "PR", label: "Londrina", value: "pr-londrina" },
  { group: "PR", label: "Maringá", value: "pr-maringa" },
  { group: "PR", label: "Cascavel", value: "pr-cascavel" },
  { group: "SP", label: "Campinas", value: "sp-campinas" },
  { group: "SP", label: "Santos", value: "sp-santos" },
  { group: "SP", label: "Sorocaba", value: "sp-sorocaba" },
  { group: "SP", label: "Jundiaí", value: "sp-jundiai" },
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

    await user.click(screen.getByRole("combobox", { name: "filter" }))

    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(2)
    expect(screen.queryByRole("option", { name: /^B/u })).not.toBeInTheDocument()
  })

  it("encaminha seleção e limpeza pelo clear nativo", async () => {
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

    await user.click(screen.getByRole("combobox", { name: "filter" }))
    const options = await screen.findAllByRole("option")
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

    await user.click(
      screen.getByRole("button", { name: "Limpar filter" }),
    )

    expect(onValueChange).toHaveBeenLastCalledWith(undefined)
  })

  it("renderiza apenas o indicador nativo no item selecionado", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="filter"
        counts={{ active: 5, invited: 3, suspended: 2 }}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="placeholder"
        value="active"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "filter" }))

    const selectedOption = await screen.findByRole("option", { name: /^A/u })

    expect(selectedOption).toHaveAttribute("aria-selected", "true")
    expect(selectedOption.querySelectorAll("svg")).toHaveLength(1)
  })

  it("renderiza lista plana sem grupos", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="filter"
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="placeholder"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "filter" }))

    expect(await screen.findAllByRole("option")).toHaveLength(3)
  })

  it("usa o próprio input para buscar e mantém os grupos", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="filter"
        items={GROUPED_ITEMS}
        onValueChange={vi.fn()}
        placeholder="placeholder"
      />,
    )

    const input = screen.getByRole("combobox", { name: "filter" })
    await user.click(input)

    expect(screen.getByText("PR")).toBeInTheDocument()
    expect(screen.getByText("SP")).toBeInTheDocument()
    expect(screen.getAllByRole("combobox")).toHaveLength(1)

    await user.type(input, "Curitiba")

    expect(await screen.findAllByRole("option")).toHaveLength(1)
    expect(
      screen.getByRole("option", { name: /Curitiba/u }),
    ).toBeInTheDocument()
  })

  it("exibe o estado vazio quando nenhuma faceta está disponível", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel="filter"
        counts={{ active: 0, invited: 0, suspended: 0 }}
        emptyMessage="Sem opções"
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="placeholder"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "filter" }))

    expect(await screen.findByText("Sem opções")).toBeInTheDocument()
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })
})
