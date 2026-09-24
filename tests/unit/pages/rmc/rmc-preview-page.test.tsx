import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { RmcPreviewPage } from "@/pages/rmc/rmc.layout"

describe("RmcPreviewPage", () => {
  it("permite abrir e percorrer os dois overlays de sessão", async () => {
    const user = userEvent.setup()

    render(<RmcPreviewPage />)

    await user.click(
      screen.getByRole("button", { name: "Visualizar aviso de inatividade" }),
    )

    const warning = screen.getByRole("alertdialog")
    expect(screen.getByRole("timer")).toHaveTextContent("00:30")

    const warningActions = within(warning).getAllByRole("button")
    await user.click(warningActions[0])

    const expired = screen.getByRole("alertdialog")
    const [signInAction] = within(expired).getAllByRole("button")
    await user.click(signInAction)

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Visualizar sessão encerrada" }),
    )

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })
})
