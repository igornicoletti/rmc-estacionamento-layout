import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DataTableRowActions } from "@/components/data-table/components/data-table-row-actions"
import { notify } from "@/components/toast/toast-notify"

vi.mock("@/components/toast/toast-notify", () => ({
  notify: vi.fn(),
}))

const showToast = vi.mocked(notify)

async function clickCopy(onCopyData: () => Promise<void>) {
  const user = userEvent.setup()

  render(
    <DataTableRowActions
      accessibleLabel="Ações do registro"
      onCopyData={onCopyData}
    />,
  )

  await user.click(screen.getByTestId("data-table-row-actions-trigger"))
  await user.click(await screen.findByTestId("data-table-row-action-copy"))
}

describe("DataTableRowActions", () => {
  beforeEach(() => {
    showToast.mockReset()
  })

  it("notifica sucesso quando a ação de cópia conclui", async () => {
    const onCopyData = vi.fn(async () => undefined)

    await clickCopy(onCopyData)

    expect(onCopyData).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" }),
      )
    })
  })

  it("notifica erro quando a ação de cópia falha", async () => {
    const onCopyData = vi.fn(async () => {
      throw new Error("clipboard unavailable")
    })

    await clickCopy(onCopyData)

    expect(onCopyData).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" }),
      )
    })
  })
})
