import { beforeEach, describe, expect, it, vi } from "vitest"

import { copyToClipboard } from "@/lib/copy-to-clipboard"

const writeText = vi.fn<(value: string) => Promise<void>>()

beforeEach(() => {
  writeText.mockReset()
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  })
})

describe("copyToClipboard", () => {
  it("encaminha o valor para a Clipboard API", async () => {
    writeText.mockResolvedValueOnce()

    await copyToClipboard("conteúdo")

    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText).toHaveBeenCalledWith("conteúdo")
  })

  it("propaga falhas da Clipboard API", async () => {
    const clipboardError = new Error("clipboard unavailable")
    writeText.mockRejectedValueOnce(clipboardError)

    await expect(copyToClipboard("conteúdo")).rejects.toBe(clipboardError)
  })
})
