import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppAlertDialog } from "@/components/app/app-alert-dialog"
import { AlertDialogCancel } from "@/components/ui/alert-dialog"

describe("AppAlertDialog", () => {
  it("expõe descrição acessível e encaminha o cancelamento", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <AppAlertDialog
        description="Descrição da confirmação"
        footer={<AlertDialogCancel>Cancelar</AlertDialogCancel>}
        onOpenChange={onOpenChange}
        open
        title="Confirmação"
      />,
    )

    expect(
      screen.getByRole("alertdialog", { name: "Confirmação" }),
    ).toHaveAccessibleDescription("Descrição da confirmação")

    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false)
  })
})
