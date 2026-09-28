import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DownloadIcon } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { AppIconButton } from "@/components/app/app-icon-button"
import { DataTableExport } from "@/components/data-table/data-table-export"
import { notify } from "@/components/toast/toast-notify"
import { renderWithProviders } from "@tests/support/render"

vi.mock("@/components/toast/toast-notify", () => ({ notify: vi.fn() }))

describe("AppIconButton", () => {
  it("explica uma ação desabilitada pelo foco sem executá-la", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <AppIconButton
        disabled
        icon={DownloadIcon}
        label="Exportar"
        tooltip="Aguarde os registros"
        onClick={onClick}
      />,
    )
    const button = screen.getByRole("button", { name: "Exportar" })
    await user.tab()
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute("aria-disabled", "true")
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Aguarde os registros",
    )
    await user.keyboard("{Enter} ")
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("mostra tooltip no hover e executa a ação habilitada", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <AppIconButton
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
