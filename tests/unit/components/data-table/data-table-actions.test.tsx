import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DataTableActions } from "@/components/data-table/data-table-actions"
import { downloadCsv } from "@/lib/export-to-csv"
import { renderWithProviders } from "@tests/support/render"

vi.mock("@/lib/export-to-csv", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/export-to-csv")>()),
  downloadCsv: vi.fn(),
}))

const table = {
  getAllLeafColumns: () => [],
  getPrePaginatedRowModel: () => ({
    rows: [{ original: { id: "02" } }, { original: { id: "01" } }],
  }),
}
const csvColumns = [
  { header: "Código", getValue: (row: { id: string }) => row.id },
]

describe("DataTableActions", () => {
  it("exporta todas as linhas do modelo filtrado na ordem corrente", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DataTableActions
        table={table}
        csvColumns={csvColumns}
        filename="registros.csv"
        isBusy={false}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Exportar CSV" }))
    expect(downloadCsv).toHaveBeenCalledWith(
      "registros.csv",
      "Código\r\n02\r\n01\r\n",
    )
  })

  it("bloqueia exportação de registros existentes durante atualização", async () => {
    vi.mocked(downloadCsv).mockClear()
    const user = userEvent.setup()
    renderWithProviders(
      <DataTableActions
        table={table}
        csvColumns={csvColumns}
        filename="registros.csv"
        isBusy
      />,
    )
    const button = screen.getByRole("button", { name: "Exportar CSV" })
    await user.tab()
    expect(button).toHaveAccessibleDescription(
      "Aguarde o carregamento dos registros para exportar",
    )
    await user.click(button)
    expect(downloadCsv).not.toHaveBeenCalled()
  })
})
