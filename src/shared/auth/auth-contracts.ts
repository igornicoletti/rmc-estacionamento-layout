import { z } from "zod"

import { userCapabilitySchema } from "@/shared/authorization/authorization"

export const AUTH_CONTRACT_VERSION = "1.0" as const

export const authorityPurposes = [
  "PREAUTH",
  "MFA_PENDING",
  "BOOTSTRAP",
  "RECOVERY",
  "NORMAL",
] as const

export const lifecycleStates = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "BLOCKED",
  "DISABLED",
  "DELETED",
] as const

export const onboardingStates = [
  "ACTIVATION_REQUIRED",
  "PASSWORD_REQUIRED",
  "SECURITY_SETUP",
  "COMPLETE",
] as const

export const authRoles = ["S", "A", "R", "M", "O"] as const
export const assuranceLevels = ["aal1", "aal2"] as const

export const activationJourneySteps = [
  "OTP_REQUIRED",
  "PASSWORD_REQUIRED",
  "SECURITY_SETUP",
  "RECONCILIATION_REQUIRED",
] as const
export const recoveryJourneySteps = [
  "OTP_REQUIRED",
  "PASSWORD_REQUIRED",
  "RECONCILIATION_REQUIRED",
] as const
export const mfaJourneySteps = ["TOTP_REQUIRED"] as const

export const authorityPurposeSchema = z.enum(authorityPurposes)
export const lifecycleSchema = z.enum(lifecycleStates)
export const onboardingSchema = z.enum(onboardingStates)
export const authRoleSchema = z.enum(authRoles)
export const assuranceLevelSchema = z.enum(assuranceLevels)

export type AuthorityPurpose = z.infer<typeof authorityPurposeSchema>
export type Lifecycle = z.infer<typeof lifecycleSchema>
export type Onboarding = z.infer<typeof onboardingSchema>
export type AuthRole = z.infer<typeof authRoleSchema>
export type AssuranceLevel = z.infer<typeof assuranceLevelSchema>

export const opaqueIdSchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/)

export const isoTimestampSchema = z.iso.datetime({ offset: true })

export const publicSessionSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  contextId: opaqueIdSchema,
  identityId: opaqueIdSchema,
  displayName: z.string().trim().min(1).max(200),
  role: authRoleSchema,
  scope: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("GLOBAL") }),
    z.strictObject({ kind: z.literal("UNIT"), unitId: opaqueIdSchema }),
  ]),
  capabilities: z.array(userCapabilitySchema).readonly(),
  assurance: assuranceLevelSchema,
  expiresAt: isoTimestampSchema,
  idleExpiresAt: isoTimestampSchema,
  serverTime: isoTimestampSchema,
  policyVersion: z.string().min(1).max(64),
  contextVersion: z.number().int().nonnegative(),
})

export const authenticatedSessionSchema = z.strictObject({
  kind: z.literal("authenticated"),
  session: publicSessionSchema,
})

export const anonymousSessionSchema = z.strictObject({
  kind: z.literal("anonymous"),
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  contextId: opaqueIdSchema,
  serverTime: isoTimestampSchema,
})

const restrictedSessionMetadata = {
  kind: z.literal("restricted"),
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  contextId: opaqueIdSchema,
  expiresAt: isoTimestampSchema,
  serverTime: isoTimestampSchema,
}

export const restrictedSessionSchema = z.discriminatedUnion("journey", [
  z.strictObject({
    ...restrictedSessionMetadata,
    journey: z.literal("activation"),
    step: z.enum(activationJourneySteps),
  }),
  z.strictObject({
    ...restrictedSessionMetadata,
    journey: z.literal("recovery"),
    step: z.enum(recoveryJourneySteps),
  }),
  z.strictObject({
    ...restrictedSessionMetadata,
    journey: z.literal("mfa"),
    step: z.enum(mfaJourneySteps),
  }),
])

export const sessionSnapshotSchema = z.union([
  anonymousSessionSchema,
  restrictedSessionSchema,
  authenticatedSessionSchema,
])

export type PublicSession = z.infer<typeof publicSessionSchema>
export type AuthenticatedSession = PublicSession
export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>
