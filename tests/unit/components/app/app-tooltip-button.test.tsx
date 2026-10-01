import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DownloadIcon } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { AppTooltipButton } from "@/components/app/app-tooltip-button"
import { DataTableExport } from "@/components/data-table/data-table-export"
import { notify } from "@/components/toast/toast-notify"
import { renderWithProviders } from "@tests/support/render"

vi.mock("@/components/toast/toast-notify", () => ({ notify: vi.fn() }))

describe("AppTooltipButton", () => {
  it("preserva o disabled nativo do Button sem executar a ação", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <AppTooltipButton
        disabled
        icon={DownloadIcon}
        label="Exportar"
        tooltip="Aguarde os registros"
        onClick={onClick}
      />,
    )
    const button = screen.getByRole("button", { name: "Exportar" })
    expect(button).toBeDisabled()
    await user.tab()
    expect(button).not.toHaveFocus()
    await user.keyboard("{Enter} ")
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("mostra tooltip no hover e executa a ação habilitada", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <AppTooltipButton
        icon={DownloadIcon}
        label="Exportar"
        tooltip="Exportar registros filtrados"
        onClick={onClick}
      />,
    )
    await user.hover(screen.getByRole("button", { name: "Exportar" }))
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Exportar registros filtrados",
    )
    await user.click(screen.getByRole("button", { name: "Exportar" }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("reporta falha ao gerar o CSV", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DataTableExport
        onExport={() => {
          throw new Error("CSV unavailable")
        }}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Exportar CSV" }))
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" }),
    )
  })
})
