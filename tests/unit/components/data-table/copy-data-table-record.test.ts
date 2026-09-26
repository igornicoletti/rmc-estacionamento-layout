import { beforeEach, describe, expect, it, vi } from "vitest"

import { notify } from "@/app/feedback/notify"
import { copyDataTableRecord } from "@/components/data-table/core/copy-data-table-record"
import { DATA_TABLE_FEEDBACK } from "@/components/data-table/data-table-feedback"
import { copyToClipboard } from "@/lib/copy-to-clipboard"

vi.mock("@/app/feedback/notify", () => ({
  notify: vi.fn(),
}))

vi.mock("@/lib/copy-to-clipboard", () => ({
  copyToClipboard: vi.fn(),
}))

const copy = vi.mocked(copyToClipboard)
const showFeedback = vi.mocked(notify)

describe("copyDataTableRecord", () => {
  beforeEach(() => {
    copy.mockReset()
    showFeedback.mockReset()
  })

  it("notifica sucesso após copiar o registro", async () => {
    copy.mockResolvedValueOnce()

    await copyDataTableRecord("registro")

    expect(copy).toHaveBeenCalledOnce()
    expect(copy).toHaveBeenCalledWith("registro")
    expect(showFeedback).toHaveBeenCalledOnce()
    expect(showFeedback).toHaveBeenCalledWith(DATA_TABLE_FEEDBACK.rowCopied)
  })

  it("notifica falha quando a Clipboard API rejeita a cópia", async () => {
    copy.mockRejectedValueOnce(new Error("clipboard unavailable"))

    await copyDataTableRecord("registro")

    expect(showFeedback).toHaveBeenCalledOnce()
    expect(showFeedback).toHaveBeenCalledWith(DATA_TABLE_FEEDBACK.rowCopyFailed)
  })
})
