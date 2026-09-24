import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { AppCombobox } from "@/components/common/app-combobox"

const ITEMS = [
  { label: "Ativo", value: "active" },
  { label: "Convidado", value: "invited" },
  { label: "Suspenso", value: "suspended" },
] as const

const GROUPED_ITEMS = [
  { group: "PR", label: "Curitiba", value: "pr-curitiba" },
  { group: "PR", label: "Londrina", value: "pr-londrina" },
  { group: "SP", label: "Campinas", value: "sp-campinas" },
  { group: "SP", label: "Santos", value: "sp-santos" },
] as const

describe("AppCombobox", () => {
  it("mantém lista plana quando os itens não possuem grupo", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <AppCombobox
        ariaLabel="status"
        items={ITEMS}
        onValueChange={vi.fn()}
        placeholder="Selecione"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "status" }))

    expect(await screen.findAllByRole("option")).toHaveLength(3)
    expect(
      document.querySelector('[data-slot="combobox-group"]'),
    ).not.toBeInTheDocument()
  })

  it("agrupa somente quando todos os itens possuem grupo", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <AppCombobox
        ariaLabel="cidade"
        items={GROUPED_ITEMS}
        onValueChange={vi.fn()}
        placeholder="Selecione"
        showGroupSeparators
      />,
    )

    const input = screen.getByRole("combobox", { name: "cidade" })
    await user.click(input)

    expect(screen.getByText("PR")).toBeInTheDocument()
    expect(screen.getByText("SP")).toBeInTheDocument()
    expect(
      document.querySelectorAll('[data-slot="combobox-separator"]'),
    ).toHaveLength(1)

    await user.type(input, "Curitiba")

    expect(await screen.findAllByRole("option")).toHaveLength(1)
  })

  it("encaminha seleção, children e limpeza nativa", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = renderWithProviders(
      <AppCombobox
        ariaLabel="status"
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder="Selecione"
      >
        {(item, state) => (
          <span data-selected={state.selected || undefined}>{item.label}</span>
        )}
      </AppCombobox>,
    )

    await user.click(screen.getByRole("combobox", { name: "status" }))
    const options = await screen.findAllByRole("option")
    await user.click(options[2])

    expect(onValueChange).toHaveBeenLastCalledWith("suspended")

    rerender(
      <AppCombobox
        ariaLabel="status"
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder="Selecione"
        value="suspended"
      >
        {(item, state) => (
          <span data-selected={state.selected || undefined}>{item.label}</span>
        )}
      </AppCombobox>,
    )

    expect(document.querySelector('[data-selected="true"]')).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Limpar seleção" }),
    )

    expect(onValueChange).toHaveBeenLastCalledWith(undefined)
  })
})
