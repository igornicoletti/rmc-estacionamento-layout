import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SessionExpiredDialog } from "@/components/overlays/session/session-expired-dialog"

describe("SessionExpiredDialog", () => {
  it("mantém a sessão encerrada bloqueante e encaminha a recuperação", async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn()

    render(
      <SessionExpiredDialog
        onSignIn={onSignIn}
        open
      />,
    )

    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(dialog).toBeInTheDocument()

    const [action] = screen.getAllByRole("button")
    await user.click(action)

    expect(onSignIn).toHaveBeenCalledOnce()
  })
})
