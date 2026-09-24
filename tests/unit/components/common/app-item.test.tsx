import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppItem } from "@/components/common/app-item"
import { Button } from "@/components/ui/button"

describe("AppItem", () => {
  it("preserva o comportamento fornecido pelos slots", async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()

    render(
      <AppItem
        actions={
          <Button onClick={onAction} type="button">
            Executar
          </Button>
        }
        description="Descrição"
        footer={<span>Rodapé</span>}
        title="Item"
      >
        <input aria-label="Conteúdo personalizado" />
      </AppItem>,
    )

    expect(
      screen.getByRole("textbox", { name: "Conteúdo personalizado" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Executar" }))

    expect(onAction).toHaveBeenCalledOnce()
  })
})
