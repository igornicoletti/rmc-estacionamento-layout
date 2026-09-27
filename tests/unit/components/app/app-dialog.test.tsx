import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppDialog } from "@/components/app/app-dialog"

describe("AppDialog", () => {
  it("fecha pelo DialogClose do rodapé", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <AppDialog onOpenChange={onOpenChange} open title="Dialog de teste">
        <input aria-label="Conteúdo do dialog" />
      </AppDialog>,
    )

    expect(screen.getByRole("dialog", { name: "Dialog de teste" })).toBeInTheDocument()

    const closeButton = screen.getByRole("button", { name: "Cancelar" })
    expect(closeButton).toHaveAttribute("data-slot", "dialog-close")
    await user.click(closeButton)

    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
  })

  it("permite alterar ou omitir o fechamento do rodapé", () => {
    const { rerender } = render(
      <AppDialog
        closeLabel="Fechar"
        onOpenChange={vi.fn()}
        open
        title="Dialog"
      >
        Conteúdo
      </AppDialog>,
    )

    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument()

    rerender(
      <AppDialog
        closeLabel={null}
        onOpenChange={vi.fn()}
        open
        title="Dialog"
      >
        Conteúdo
      </AppDialog>,
    )

    expect(screen.queryByRole("button", { name: "Fechar" })).not.toBeInTheDocument()
  })
})
