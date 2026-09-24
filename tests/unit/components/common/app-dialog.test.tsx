import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppDialog } from "@/components/common/app-dialog"
import { Button } from "@/components/ui/button"

describe("AppDialog", () => {
  it("mantém children e footer no contrato e encaminha o fechamento", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <AppDialog
        footer={<Button type="button">Ação</Button>}
        onOpenChange={onOpenChange}
        open
        title="Dialog de teste"
      >
        <input aria-label="Conteúdo do dialog" />
      </AppDialog>,
    )

    expect(
      screen.getByRole("textbox", { name: "Conteúdo do dialog" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ação" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Fechar" }))

    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
  })
})
