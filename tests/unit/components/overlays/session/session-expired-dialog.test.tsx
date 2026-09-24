import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SessionExpiredDialog } from "@/components/overlays/session/session-expired-dialog"

describe("SessionExpiredDialog", () => {
  it("encaminha a recuperação da sessão encerrada", async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn()

    render(<SessionExpiredDialog onSignIn={onSignIn} open />)

    const dialog = screen.getByRole("alertdialog")
    const [action] = within(dialog).getAllByRole("button")

    await user.click(action)

    expect(onSignIn).toHaveBeenCalledOnce()
  })

  it("bloqueia nova tentativa enquanto a recuperação está em andamento", () => {
    render(<SessionExpiredDialog isPending onSignIn={vi.fn()} open />)

    const dialog = screen.getByRole("alertdialog")
    const [action] = within(dialog).getAllByRole("button")

    expect(action).toBeDisabled()
    expect(action).toHaveAttribute("aria-busy", "true")
  })
})
