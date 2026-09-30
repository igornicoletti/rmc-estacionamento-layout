import { describe, expect, it } from "vitest"

import { authPolicy, evaluateFreshness } from "@/shared/auth"

const nowMs = Date.parse("2026-09-30T17:00:00Z")
const base = {
  nowMs,
  verifiedAtMs: nowMs,
  currentSessionId: "session-a",
  verifiedSessionId: "session-a",
  currentIntentHash: "intent-a",
  verifiedIntentHash: "intent-a",
}

describe("fresh step-up", () => {
  it("aceita exatamente 300 s e 30 s futuros (T10)", () => {
    expect(
      evaluateFreshness({
        ...base,
        verifiedAtMs: nowMs - authPolicy.freshStepUpMs,
      }),
    ).toEqual({ allowed: true })
    expect(
      evaluateFreshness({
        ...base,
        verifiedAtMs: nowMs + authPolicy.futureClockSkewMs,
      }),
    ).toEqual({ allowed: true })
  })

  it.each([
    [{ verifiedAtMs: nowMs - authPolicy.freshStepUpMs - 1 }, "STALE_PROOF"],
    [{ verifiedAtMs: nowMs + authPolicy.futureClockSkewMs + 1 }, "FUTURE_TIMESTAMP"],
    [{ verifiedSessionId: "session-b" }, "SESSION_MISMATCH"],
    [{ verifiedIntentHash: "intent-b" }, "INTENT_MISMATCH"],
  ] as const)("nega prova fora do vínculo (%s)", (change, reason) => {
    expect(evaluateFreshness({ ...base, ...change })).toEqual({
      allowed: false,
      reason,
    })
  })
})

