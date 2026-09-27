import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppDialog } from "@/components/app/app-dialog"

describe("AppDialog", () => {
  it("encaminha o fechamento por Escape", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <AppDialog onOpenChange={onOpenChange} open title="Dialog de teste">
        <input aria-label="Conteúdo do dialog" />
      </AppDialog>,
    )

    expect(screen.getByRole("dialog", { name: "Dialog de teste" })).toBeInTheDocument()

    await user.keyboard("{Escape}")

    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
  })
})
