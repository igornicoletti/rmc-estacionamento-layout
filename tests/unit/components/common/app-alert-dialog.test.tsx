import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppAlertDialog } from "@/components/common/app-alert-dialog"
import { AlertDialogCancel } from "@/components/ui/alert-dialog"

describe("AppAlertDialog", () => {
  it("mantém slots opcionais e encaminha o cancelamento", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <AppAlertDialog
        footer={<AlertDialogCancel>Cancelar</AlertDialogCancel>}
        media={<span data-testid="media" />}
        onOpenChange={onOpenChange}
        open
        title="Confirmação"
      >
        <div data-testid="conteudo-adicional" />
      </AppAlertDialog>,
    )

    expect(
      screen.getByRole("alertdialog", { name: "Confirmação" }),
    ).toBeInTheDocument()
    expect(screen.getByTestId("media")).toBeInTheDocument()
    expect(screen.getByTestId("conteudo-adicional")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
  })
})
