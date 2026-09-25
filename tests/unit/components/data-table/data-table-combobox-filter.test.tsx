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
        ariaLabel={ITEMS[0].value}
        counts={{ active: 5, invited: 0, suspended: 2 }}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder={ITEMS[0].label}
      />,
    )

    const input = screen.getByRole("combobox")

    expect(input).toHaveAccessibleName()

    await user.click(input)

    expect(await screen.findAllByRole("option")).toHaveLength(2)
  })

  it("encaminha seleção e limpeza pelo clear nativo", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    const { rerender } = renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel={ITEMS[0].value}
        counts={{ active: 5, invited: 3, suspended: 2 }}
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder={ITEMS[0].label}
      />,
    )

    await user.click(screen.getByRole("combobox"))

    const options = await screen.findAllByRole("option")
    const targetOption = options[2]

    if (!targetOption) {
      throw new Error("Opção esperada não encontrada.")
    }

    await user.click(targetOption)

    expect(onValueChange).toHaveBeenLastCalledWith("suspended")

    rerender(
      <DataTableComboboxFilter
        ariaLabel={ITEMS[0].value}
        counts={{ active: 5, invited: 3, suspended: 0 }}
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder={ITEMS[0].label}
        value="suspended"
      />,
    )

    const clearButton = document.querySelector<HTMLElement>(
      '[data-slot="combobox-clear"]',
    )

    expect(clearButton).not.toBeNull()

    if (!clearButton) {
      throw new Error("Controle nativo de limpeza não encontrado.")
    }

    await user.click(clearButton)

    expect(onValueChange).toHaveBeenLastCalledWith(undefined)
  })

  it("renderiza apenas o indicador nativo no item selecionado", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel={ITEMS[0].value}
        counts={{ active: 5, invited: 3, suspended: 2 }}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder={ITEMS[0].label}
        value="active"
      />,
    )

    await user.click(screen.getByRole("combobox"))

    const options = await screen.findAllByRole("option")
    const selectedOptions = options.filter(
      (option) => option.getAttribute("aria-selected") === "true",
    )

    expect(selectedOptions).toHaveLength(1)

    const [selectedOption] = selectedOptions

    if (!selectedOption) {
      throw new Error("Opção selecionada não encontrada.")
    }

    expect(selectedOption.querySelectorAll("svg")).toHaveLength(1)
  })

  it("renderiza lista plana sem grupos", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel={ITEMS[0].value}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder={ITEMS[0].label}
      />,
    )

    await user.click(screen.getByRole("combobox"))

    expect(await screen.findAllByRole("option")).toHaveLength(3)
    expect(
      document.querySelectorAll('[data-slot="combobox-group"]'),
    ).toHaveLength(0)
  })

  it("usa o próprio input para buscar e preserva os grupos", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel={GROUPED_ITEMS[0].value}
        items={GROUPED_ITEMS}
        onValueChange={onValueChange}
        placeholder={GROUPED_ITEMS[0].label}
      />,
    )

    const input = screen.getByRole("combobox")

    await user.click(input)

    expect(
      document.querySelectorAll('[data-slot="combobox-group"]'),
    ).toHaveLength(2)
    expect(screen.getAllByRole("combobox")).toHaveLength(1)

    await user.type(input, GROUPED_ITEMS[0].label)

    const options = await screen.findAllByRole("option")

    expect(options).toHaveLength(1)

    const [option] = options

    if (!option) {
      throw new Error("Resultado filtrado não encontrado.")
    }

    await user.click(option)

    expect(onValueChange).toHaveBeenLastCalledWith(GROUPED_ITEMS[0].value)
  })

  it("não expõe opções quando nenhuma faceta está disponível", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTableComboboxFilter
        ariaLabel={ITEMS[0].value}
        counts={{ active: 0, invited: 0, suspended: 0 }}
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder={ITEMS[0].label}
      />,
    )

    await user.click(screen.getByRole("combobox"))

    expect(
      document.querySelector('[data-slot="combobox-empty"]'),
    ).not.toBeNull()
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })
})
