import { describe, expect, it } from "vitest"

import { validateAndNormalizePassword } from "@/shared/auth/auth-index"

describe("política canônica de senha", () => {
  it("normaliza NFC antes de contar e preserva espaços (T31)", () => {
    const decomposed = `  ${"e\u0301".repeat(13)}`
    const result = validateAndNormalizePassword(decomposed)

    expect(result).toMatchObject({ valid: true, codePoints: 15 })
    if (result.valid) {
      expect(result.normalized).toBe(`  ${"é".repeat(13)}`)
      expect(result.normalized.startsWith("  ")).toBe(true)
    }
  })

  it.each([
    ["a".repeat(14), "TOO_SHORT"],
    ["a".repeat(65), "TOO_LONG"],
    ["😀".repeat(19), "TOO_MANY_UTF8_BYTES"],
    [`${"a".repeat(15)}\ud800`, "INVALID_UNICODE"],
  ] as const)("rejeita limite sem truncar (%s)", (password, error) => {
    expect(validateAndNormalizePassword(password)).toEqual({ valid: false, error })
  })
})
