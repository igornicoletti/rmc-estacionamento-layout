import { authPolicy } from "./auth-policy"

export type FreshnessInput = {
  nowMs: number
  verifiedAtMs: number
  currentSessionId: string
  verifiedSessionId: string
  currentIntentHash: string
  verifiedIntentHash: string
}

export type FreshnessDecision =
  | { allowed: true }
  | {
      allowed: false
      reason:
        | "SESSION_MISMATCH"
        | "INTENT_MISMATCH"
        | "FUTURE_TIMESTAMP"
        | "STALE_PROOF"
    }

export function evaluateFreshness(input: FreshnessInput): FreshnessDecision {
  if (input.currentSessionId !== input.verifiedSessionId) {
    return { allowed: false, reason: "SESSION_MISMATCH" }
  }
  if (input.currentIntentHash !== input.verifiedIntentHash) {
    return { allowed: false, reason: "INTENT_MISMATCH" }
  }

  const age = input.nowMs - input.verifiedAtMs
  if (age < -authPolicy.futureClockSkewMs) {
    return { allowed: false, reason: "FUTURE_TIMESTAMP" }
  }
  if (age > authPolicy.freshStepUpMs) {
    return { allowed: false, reason: "STALE_PROOF" }
  }
  return { allowed: true }
}

