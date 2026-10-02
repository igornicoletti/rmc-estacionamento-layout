import { describe, expect, it } from "vitest"
import {
  activationAcceptedSchema, activationCompleteSchema, activationPasswordSchema,
  activationRequestSchema, activationTotpEnrollSchema, activationTotpVerifySchema,
  activationVerifySchema,
} from "@/shared/auth/auth-activation"

const commandId = "10000000-0000-4000-8000-000000000001"

describe("F06 activation DTOs", () => {
  it("keeps command, OTP and public response contracts closed", () => {
    const base = { contractVersion: "1.1", commandId }
    expect(activationRequestSchema.safeParse({ ...base, cpf: "52998224725" }).success).toBe(true)
    expect(activationRequestSchema.safeParse({ ...base, cpf: "52998224725", role: "S" }).success).toBe(false)
    expect(activationVerifySchema.safeParse({ ...base, challengeId: commandId, code: "00001234" }).success).toBe(true)
    expect(activationVerifySchema.safeParse({ ...base, challengeId: commandId, code: "0000123" }).success).toBe(false)
    expect(activationPasswordSchema.safeParse({ ...base, password: "Some long password" }).success).toBe(true)
    expect(activationCompleteSchema.safeParse(base).success).toBe(true)
    expect(activationTotpEnrollSchema.safeParse(base).success).toBe(true)
    expect(activationTotpVerifySchema.safeParse({ ...base, code: "000123" }).success).toBe(true)
    expect(activationTotpVerifySchema.safeParse({ ...base, code: "00012" }).success).toBe(false)
    expect(activationAcceptedSchema.safeParse({ contractVersion: "1.1", challengeId: commandId,
      expiresAt: "2026-10-02T15:00:00Z", csrfToken: "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE" }).success).toBe(true)
    expect(activationAcceptedSchema.safeParse({ contractVersion: "1.1", challengeId: commandId,
      expiresAt: "2026-10-02T15:00:00Z", identityId: commandId }).success).toBe(false)
  })
})
