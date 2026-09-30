import { z } from "zod"

import { userCapabilitySchema } from "@/shared/authorization"

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

const publicSessionFields = {
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  contextId: opaqueIdSchema,
  identityId: opaqueIdSchema,
  displayName: z.string().trim().min(1).max(200),
  role: authRoleSchema,
  scope: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("GLOBAL") }).strict(),
    z
      .object({ kind: z.literal("UNIT"), unitId: opaqueIdSchema })
      .strict(),
  ]),
  capabilities: z.array(userCapabilitySchema).readonly(),
  assurance: assuranceLevelSchema,
  freshUntil: isoTimestampSchema.nullable(),
  expiresAt: isoTimestampSchema,
  idleExpiresAt: isoTimestampSchema,
  serverTime: isoTimestampSchema,
  policyVersion: z.string().min(1).max(64),
  contextVersion: z.number().int().nonnegative(),
}

export const authenticatedSessionSchema = z
  .object({ state: z.literal("authenticated"), ...publicSessionFields })
  .strict()

export const anonymousSessionSchema = z
  .object({
    state: z.literal("anonymous"),
    contractVersion: z.literal(AUTH_CONTRACT_VERSION),
    contextId: opaqueIdSchema,
    serverTime: isoTimestampSchema,
  })
  .strict()

export const restrictedSessionSchema = z
  .object({
    state: z.literal("restricted"),
    contractVersion: z.literal(AUTH_CONTRACT_VERSION),
    contextId: opaqueIdSchema,
    purpose: z.enum(["MFA_PENDING", "BOOTSTRAP", "RECOVERY"]),
    step: z.string().min(1).max(64),
    expiresAt: isoTimestampSchema,
    serverTime: isoTimestampSchema,
  })
  .strict()

export const sessionSnapshotSchema = z.discriminatedUnion("state", [
  anonymousSessionSchema,
  restrictedSessionSchema,
  authenticatedSessionSchema,
])

export type AuthenticatedSession = z.infer<typeof authenticatedSessionSchema>
export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>
