import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SessionTimeoutWarningDialog } from "@/components/dialogs/session-timeout"

describe("SessionTimeoutWarningDialog", () => {
  it("prioriza e encaminha a continuidade da sessão", async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()

    render(
      <SessionTimeoutWarningDialog
        onContinue={onContinue}
        open
        remainingSeconds={65}
      />,
    )

    const dialog = screen.getByRole("alertdialog")
    const action = within(dialog).getByRole("button", {
      name: "Continuar conectado",
    })

    expect(screen.getByRole("timer")).toHaveTextContent("01:05")

    await waitFor(() => {
      expect(action).toHaveFocus()
    })

    await user.click(action)

    expect(onContinue).toHaveBeenCalledOnce()
  })

  it("bloqueia nova tentativa enquanto a continuidade está em andamento", () => {
    render(
      <SessionTimeoutWarningDialog
        isPending
        onContinue={vi.fn()}
        open
        remainingSeconds={30}
      />,
    )

    const action = within(screen.getByRole("alertdialog")).getByRole("button")

    expect(action).toBeDisabled()
    expect(action).toHaveAttribute("aria-busy", "true")
  })

  it("trata Escape como presença e solicita a continuidade da sessão", async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()

    render(
      <SessionTimeoutWarningDialog
        onContinue={onContinue}
        open
        remainingSeconds={30}
      />,
    )

    await user.keyboard("{Escape}")

    expect(onContinue).toHaveBeenCalledOnce()
  })
})
