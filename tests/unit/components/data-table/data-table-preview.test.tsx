import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@tests/support/render"

import { DataTablePreview } from "@/components/data-table/components/data-table-preview"

describe("DataTablePreview", () => {
  it("integra busca e ação da linha sem depender da copy da interface", async () => {
    const user = userEvent.setup()
    const idPrefix = "usr"
    const recordId = `${idPrefix}-028`

    renderWithProviders(
      <DataTablePreview
        caption="preview"
        idPrefix={idPrefix}
        itemLabel={{ singular: "item", plural: "items" }}
      />,
    )

    const search = screen.getByRole("searchbox")
    const table = screen.getByRole("table")

    expect(search).toHaveAccessibleName()

    await user.type(search, recordId)
    await user.keyboard("{Enter}")

    const rows = within(table).getAllByRole("row")

    expect(rows).toHaveLength(2)

    const action = within(rows[1]).getByRole("button")

    expect(action).toHaveAccessibleName()

    await user.click(action)
    await user.click(await screen.findByRole("menuitem"))

    await expect(navigator.clipboard.readText()).resolves.toContain(recordId)
  })
})
