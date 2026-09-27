import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppSheet } from "@/components/app/app-sheet"

describe("AppSheet", () => {
  it("encaminha o fechamento por Escape", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <AppSheet onOpenChange={onOpenChange} open title="Sheet de teste">
        <input aria-label="Conteúdo do sheet" />
      </AppSheet>,
    )

    expect(screen.getByRole("dialog", { name: "Sheet de teste" })).toBeInTheDocument()

    await user.keyboard("{Escape}")

    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
  })
})
