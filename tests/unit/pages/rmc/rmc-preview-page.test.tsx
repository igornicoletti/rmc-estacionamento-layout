import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { RmcPreviewPage } from "@/pages/rmc/rmc.layout"

describe("RmcPreviewPage", () => {
  it("permite abrir e validar os dois overlays de sessão", async () => {
    const user = userEvent.setup()

    render(<RmcPreviewPage />)

    await user.click(
      screen.getByRole("button", { name: "Visualizar aviso de inatividade" }),
    )

    const warning = screen.getByRole("alertdialog")
    expect(screen.getByRole("timer")).toHaveTextContent("00:30")

    await user.click(
      within(warning).getByRole("button", { name: "Continuar conectado" }),
    )

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Visualizar sessão encerrada" }),
    )

    const expired = screen.getByRole("alertdialog")
    expect(
      within(expired).getByRole("button", { name: "Entrar novamente" }),
    ).toBeInTheDocument()
  })
})
