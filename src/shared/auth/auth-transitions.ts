import {
  lifecycleSchema,
  onboardingSchema,
  type Lifecycle,
  type Onboarding,
} from "./auth-contracts"

type TransitionFacts = Readonly<Record<string, boolean | undefined>>

export type TransitionDecision =
  | { allowed: true }
  | {
      allowed: false
      reason:
        | "INVALID_INPUT"
        | "UNKNOWN_STATE"
        | "TRANSITION_NOT_ALLOWED"
        | "FACTS_REQUIRED"
    }

type TransitionInput = {
  from: unknown
  to: unknown
  facts?: TransitionFacts
}

const hasFacts = (
  facts: TransitionFacts | undefined,
  required: readonly string[],
) => required.every((fact) => facts?.[fact] === true)

const lifecycleRequirements: Readonly<
  Partial<
    Record<Lifecycle | "ABSENT", Partial<Record<Lifecycle, readonly string[]>>>
  >
> = {
  ABSENT: {
    PENDING: ["provisioningAuthorized", "consistencyProved"],
  },
  PENDING: {
    ACTIVE: ["onboardingComplete", "proofsComplete", "assignmentEligible"],
    DELETED: [
      "controlledProcedure",
      "retentionEvaluated",
      "fenceRecorded",
      "durableEventRecorded",
    ],
  },
  ACTIVE: {
    SUSPENDED: ["commandAuthorized", "fenceRecorded", "durableEventRecorded"],
    BLOCKED: ["commandAuthorized", "fenceRecorded", "durableEventRecorded"],
    DISABLED: ["commandAuthorized", "fenceRecorded", "durableEventRecorded"],
    DELETED: [
      "controlledProcedure",
      "retentionEvaluated",
      "fenceRecorded",
      "durableEventRecorded",
    ],
  },
  SUSPENDED: {
    ACTIVE: ["commandAuthorized", "eligibilityConfirmed", "generationAdvanced"],
    DELETED: [
      "controlledProcedure",
      "retentionEvaluated",
      "fenceRecorded",
      "durableEventRecorded",
    ],
  },
  BLOCKED: {
    ACTIVE: ["commandAuthorized", "eligibilityConfirmed", "generationAdvanced"],
    DELETED: [
      "controlledProcedure",
      "retentionEvaluated",
      "fenceRecorded",
      "durableEventRecorded",
    ],
  },
  DISABLED: {
    ACTIVE: ["commandAuthorized", "eligibilityConfirmed", "generationAdvanced"],
    DELETED: [
      "controlledProcedure",
      "retentionEvaluated",
      "fenceRecorded",
      "durableEventRecorded",
    ],
  },
  DELETED: {},
}

const onboardingRequirements: Readonly<
  Record<Onboarding, Partial<Record<Onboarding, readonly string[]>>>
> = {
  ACTIVATION_REQUIRED: {
    PASSWORD_REQUIRED: ["possessionProved"],
  },
  PASSWORD_REQUIRED: {
    SECURITY_SETUP: ["passwordCommitProved"],
  },
  SECURITY_SETUP: {
    COMPLETE: ["securitySetupResolved", "finalCommitEligible"],
  },
  COMPLETE: {},
}

export function evaluateLifecycleTransition(input: unknown): TransitionDecision {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { allowed: false, reason: "INVALID_INPUT" }
  }

  const { from, to, facts } = input as TransitionInput
  const parsedFrom =
    from === null
      ? { success: true as const, data: "ABSENT" as const }
      : lifecycleSchema.safeParse(from)
  const parsedTo = lifecycleSchema.safeParse(to)

  if (!parsedFrom.success || !parsedTo.success) {
    return { allowed: false, reason: "UNKNOWN_STATE" }
  }

  const required = lifecycleRequirements[parsedFrom.data]?.[parsedTo.data]
  if (!required) return { allowed: false, reason: "TRANSITION_NOT_ALLOWED" }
  return hasFacts(facts, required)
    ? { allowed: true }
    : { allowed: false, reason: "FACTS_REQUIRED" }
}

export function evaluateOnboardingTransition(input: unknown): TransitionDecision {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { allowed: false, reason: "INVALID_INPUT" }
  }

  const { from, to, facts } = input as TransitionInput
  const parsedFrom = onboardingSchema.safeParse(from)
  const parsedTo = onboardingSchema.safeParse(to)

  if (!parsedFrom.success || !parsedTo.success) {
    return { allowed: false, reason: "UNKNOWN_STATE" }
  }

  const required = onboardingRequirements[parsedFrom.data][parsedTo.data]
  if (!required) return { allowed: false, reason: "TRANSITION_NOT_ALLOWED" }
  return hasFacts(facts, required)
    ? { allowed: true }
    : { allowed: false, reason: "FACTS_REQUIRED" }
}
