import type { AssuranceLevel } from "./auth-contracts"
import { authPolicy } from "./auth-policy"

export type FreshnessInput = {
  nowMs: number
  verifiedAtMs: number
  currentSessionId: string
  verifiedSessionId: string
  currentIntentHash: string
  verifiedIntentHash: string
  requiredAal: AssuranceLevel
  verifiedAal: AssuranceLevel
  requiredAmr?: string
  verifiedAmr: readonly string[]
}

export type FreshnessDecision =
  | { allowed: true }
  | {
      allowed: false
      reason:
        | "INVALID_PROOF"
        | "SESSION_MISMATCH"
        | "INTENT_MISMATCH"
        | "ASSURANCE_MISMATCH"
        | "AMR_MISMATCH"
        | "FUTURE_TIMESTAMP"
        | "STALE_PROOF"
    }

const assuranceRank: Readonly<Record<AssuranceLevel, number>> = {
  aal1: 1,
  aal2: 2,
}

export function evaluateFreshness(input: FreshnessInput): FreshnessDecision {
  if (
    !Number.isFinite(input.nowMs) ||
    !Number.isFinite(input.verifiedAtMs) ||
    input.currentSessionId.length === 0 ||
    input.verifiedSessionId.length === 0 ||
    input.currentIntentHash.length === 0 ||
    input.verifiedIntentHash.length === 0
  ) {
    return { allowed: false, reason: "INVALID_PROOF" }
  }

  if (input.currentSessionId !== input.verifiedSessionId) {
    return { allowed: false, reason: "SESSION_MISMATCH" }
  }
  if (input.currentIntentHash !== input.verifiedIntentHash) {
    return { allowed: false, reason: "INTENT_MISMATCH" }
  }
  if (assuranceRank[input.verifiedAal] < assuranceRank[input.requiredAal]) {
    return { allowed: false, reason: "ASSURANCE_MISMATCH" }
  }
  if (
    input.requiredAmr !== undefined &&
    !input.verifiedAmr.includes(input.requiredAmr)
  ) {
    return { allowed: false, reason: "AMR_MISMATCH" }
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
