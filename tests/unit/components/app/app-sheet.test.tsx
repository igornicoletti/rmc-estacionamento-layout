import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppSheet } from "@/components/app/app-sheet"

describe("AppSheet", () => {
  it("fecha pelo SheetClose padrão do rodapé", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <AppSheet onOpenChange={onOpenChange} open title="Sheet de teste">
        <input aria-label="Conteúdo do sheet" />
      </AppSheet>,
    )

    expect(screen.getByRole("dialog", { name: "Sheet de teste" })).toBeInTheDocument()

    const closeButton = screen.getByRole("button", { name: "Cancelar" })
    expect(closeButton).toHaveAttribute("data-slot", "sheet-close")
    await user.click(closeButton)

    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
  })

  it("permite alterar ou omitir o fechamento do rodapé", () => {
    const { rerender } = render(
      <AppSheet
        closeLabel="Fechar"
        onOpenChange={vi.fn()}
        open
        title="Sheet"
      >
        Conteúdo
      </AppSheet>,
    )

    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument()

    rerender(
      <AppSheet
        closeLabel={null}
        onOpenChange={vi.fn()}
        open
        title="Sheet"
      >
        Conteúdo
      </AppSheet>,
    )

    expect(screen.queryByRole("button", { name: "Fechar" })).not.toBeInTheDocument()
  })
})
