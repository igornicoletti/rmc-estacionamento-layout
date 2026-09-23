import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { DataTablePreview } from "@/components/data-table/components/data-table-preview"

describe("DataTablePreview", () => {
  it("compõe busca, colunas, paginação e cópia dos dados disponíveis", async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DataTablePreview
        caption="Lista de usuários"
        idPrefix="usr"
        itemLabel={{ singular: "usuário", plural: "usuários" }}
      />,
    )

    expect(
      screen.getByRole("searchbox", { name: "Buscar registros" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Colunas" })).toBeInTheDocument()
    expect(screen.getByText("28 usuários")).toBeInTheDocument()
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Ações do ID usr-001" }),
    )

    expect(
      screen.queryByRole("menuitem", { name: "Detalhes" }),
    ).not.toBeInTheDocument()

    await user.click(
      await screen.findByRole("menuitem", { name: "Copiar dados" }),
    )

    await expect(navigator.clipboard.readText()).resolves.toBe("ID: usr-001")
  })
})
