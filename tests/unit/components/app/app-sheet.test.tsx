import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { AppSheet } from "@/components/app/app-sheet"

function ControlledSheet() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">Abrir</button>
      <AppSheet onOpenChange={setOpen} open={open} title="Edição">
        <input aria-label="Nome" />
      </AppSheet>
    </>
  )
}

describe("AppSheet", () => {
  it("encaminha o fechamento do rodapé", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <AppSheet onOpenChange={onOpenChange} open title="Sheet de teste">
        <input aria-label="Conteúdo do sheet" />
      </AppSheet>,
    )
    expect(screen.getByRole("dialog", { name: "Sheet de teste" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
  })

  it("permite alterar ou omitir o fechamento do rodapé sem remover o superior", () => {
    const { rerender } = render(
      <AppSheet closeLabel="Voltar" onOpenChange={vi.fn()} open title="Sheet">
        Conteúdo
      </AppSheet>,
    )
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument()
    rerender(
      <AppSheet closeLabel={null} onOpenChange={vi.fn()} open title="Sheet">
        Conteúdo
      </AppSheet>,
    )
    expect(screen.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument()
  })

  it.each(["escape", "cancel", "close"] as const)(
    "fecha de fato por %s e devolve o foco ao acionador externo",
    async (method) => {
      const user = userEvent.setup()
      render(<ControlledSheet />)
      const opener = screen.getByRole("button", { name: "Abrir" })
      await user.click(opener)
      const input = await screen.findByRole("textbox", { name: "Nome" })
      await user.type(input, "Rascunho")
      expect(input).toHaveValue("Rascunho")
      if (method === "escape") {
        await user.keyboard("{Escape}")
      } else {
        await user.click(screen.getByRole("button", {
          name: method === "cancel" ? "Cancelar" : "Fechar",
        }))
      }
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      await waitFor(() => expect(opener).toHaveFocus())
    },
  )
})
