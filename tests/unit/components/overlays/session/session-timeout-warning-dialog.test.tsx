import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SessionTimeoutWarningDialog } from "@/components/overlays/session/session-timeout-warning-dialog"

describe("SessionTimeoutWarningDialog", () => {
  it("expõe a contagem e encaminha as duas respostas", async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    const onSignOut = vi.fn()

    render(
      <SessionTimeoutWarningDialog
        onContinue={onContinue}
        onSignOut={onSignOut}
        open
        remainingSeconds={65}
      />,
    )

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(screen.getByRole("timer")).toHaveTextContent("01:05")

    const actions = screen.getAllByRole("button")
    expect(actions).toHaveLength(2)

    await user.click(actions[0])
    await user.click(actions[1])

    expect(onSignOut).toHaveBeenCalledOnce()
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it("não permite dispensar o aviso por Escape", async () => {
    const user = userEvent.setup()

    render(
      <SessionTimeoutWarningDialog
        onContinue={vi.fn()}
        onSignOut={vi.fn()}
        open
        remainingSeconds={30}
      />,
    )

    await user.keyboard("{Escape}")

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })
})
