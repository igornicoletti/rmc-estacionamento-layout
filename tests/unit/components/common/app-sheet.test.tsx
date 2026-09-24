import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppSheet } from "@/components/common/app-sheet"
import { Button } from "@/components/ui/button"

describe("AppSheet", () => {
  it("mantém children e footer e encaminha mudanças de abertura", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <AppSheet
        footer={<Button type="button">Ação</Button>}
        onOpenChange={onOpenChange}
        open
        title="Sheet de teste"
      >
        <input aria-label="Conteúdo do sheet" />
      </AppSheet>,
    )

    expect(
      screen.getByRole("textbox", { name: "Conteúdo do sheet" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ação" })).toBeInTheDocument()

    await user.keyboard("{Escape}")

    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
  })
})
