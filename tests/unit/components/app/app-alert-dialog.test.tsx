import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AppAlertDialog } from "@/components/app/app-alert-dialog"

describe("AppAlertDialog", () => {
  it("expõe descrição acessível e encaminha o cancelamento", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <AppAlertDialog
        action="Confirmar"
        description="Descrição da confirmação"
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

  it("usa as ações nativas e permite omitir o cancelamento", () => {
    const { rerender } = render(
      <AppAlertDialog
        action="Excluir"
        description="Descrição"
        onOpenChange={vi.fn()}
        open
        title="Confirmação"
      />,
    )

    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveAttribute(
      "data-slot",
      "alert-dialog-cancel",
    )
    expect(screen.getByRole("button", { name: "Excluir" })).toHaveAttribute(
      "data-slot",
      "alert-dialog-action",
    )

    rerender(
      <AppAlertDialog
        action="Excluir"
        cancelLabel={null}
        description="Descrição"
        onOpenChange={vi.fn()}
        open
        title="Confirmação"
      />,
    )

    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument()
  })
})
