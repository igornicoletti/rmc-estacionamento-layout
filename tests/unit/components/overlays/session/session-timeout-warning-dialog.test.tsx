import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SessionTimeoutWarningDialog } from "@/components/overlays/session/session-timeout-warning-dialog"

describe("SessionTimeoutWarningDialog", () => {
  it("prioriza a continuidade da sessão e encaminha as duas respostas", async () => {
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

    const dialog = screen.getByRole("alertdialog")
    const actions = within(dialog).getAllByRole("button")

    expect(screen.getByRole("timer")).toHaveTextContent("01:05")

    await waitFor(() => {
      expect(actions[1]).toHaveFocus()
    })

    await user.click(actions[0])
    await user.click(actions[1])

    expect(onSignOut).toHaveBeenCalledOnce()
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it("bloqueia novas ações enquanto uma resposta está em andamento", () => {
    render(
      <SessionTimeoutWarningDialog
        onContinue={vi.fn()}
        onSignOut={vi.fn()}
        open
        pendingAction="continue"
        remainingSeconds={30}
      />,
    )

    const actions = within(screen.getByRole("alertdialog")).getAllByRole("button")

    expect(actions[0]).toBeDisabled()
    expect(actions[1]).toBeDisabled()
    expect(actions[1]).toHaveAttribute("aria-busy", "true")
  })

  it("mantém o aviso aberto quando o usuário pressiona Escape", async () => {
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
