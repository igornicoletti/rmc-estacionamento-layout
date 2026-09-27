import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppCombobox } from "@/components/app/app-combobox"
import { renderWithProviders } from "@tests/support/render"

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
  it("expõe opções de uma lista sem grupos", async () => {
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
  })

  it("expõe grupos e filtra pelo próprio input", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <AppCombobox
        ariaLabel="cidade"
        items={GROUPED_ITEMS}
        onValueChange={vi.fn()}
        placeholder="Selecione"
      />,
    )

    const input = screen.getByRole("combobox", { name: "cidade" })
    await user.click(input)

    expect(screen.getByText("PR")).toBeInTheDocument()
    expect(screen.getByText("SP")).toBeInTheDocument()

    await user.type(input, "Curitiba")

    expect(await screen.findAllByRole("option")).toHaveLength(1)
  })

  it("mantém uma lista parcialmente agrupada sem cabeçalhos", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <AppCombobox
        ariaLabel="cidade"
        items={[GROUPED_ITEMS[0], { label: "Outras", value: "other" }]}
        onValueChange={vi.fn()}
        placeholder="Selecione"
      />,
    )

    await user.click(screen.getByRole("combobox", { name: "cidade" }))

    expect(await screen.findAllByRole("option")).toHaveLength(2)
    expect(screen.queryByText("PR")).not.toBeInTheDocument()
  })

  it("encaminha seleção e limpeza nativa", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = renderWithProviders(
      <AppCombobox
        ariaLabel="status"
        items={ITEMS}
        onValueChange={onValueChange}
        placeholder="Selecione"
      />,
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
      />,
    )

    await user.click(screen.getByRole("button", { name: "Limpar seleção" }))

    expect(onValueChange).toHaveBeenLastCalledWith(undefined)
  })
})
