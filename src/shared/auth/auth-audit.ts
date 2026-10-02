import { z } from "zod"

import { userCapabilitySchema } from "../authorization/authorization"
import { authorityPurposeSchema, opaqueIdSchema } from "./auth-contracts"

export const auditEventTypes = [
  "AUTH_LOGIN_OUTCOME", "MFA_OUTCOME", "SESSION_REVOKED",
  "SESSION_REFRESH_OUTCOME", "CHALLENGE_REQUESTED", "CHALLENGE_VERIFIED",
  "RECOVERY_OUTCOME", "ADMIN_COMMAND_OUTCOME", "DELIVERY_OUTCOME",
  "RECONCILIATION_REQUIRED", "RECONCILIATION_RESOLVED",
] as const

export const auditReasonCodes = [
  "VERIFIED", "REVOKED", "COMMITTED", "ACCEPTED", "DELIVERED", "EXPIRED", "STALE", "RECONCILIATION_REQUIRED",
  "AUTH_INVALID_REQUEST", "AUTH_SESSION_INVALID", "AUTH_CREDENTIALS_INVALID", "AUTH_ORIGIN_DENIED",
  "AUTH_CSRF_INVALID", "AUTH_ACCESS_DENIED", "AUTH_STEP_UP_REQUIRED", "RESOURCE_NOT_FOUND",
  "AUTH_STATE_CONFLICT", "AUTH_BODY_TOO_LARGE", "AUTH_UNSUPPORTED_MEDIA_TYPE", "AUTH_RATE_LIMITED",
  "AUTH_CONFIGURATION_ERROR", "AUTH_UNEXPECTED_ERROR", "AUTH_PROVIDER_FAILURE", "AUTH_DEPENDENCY_UNAVAILABLE", "AUTH_DEPENDENCY_TIMEOUT",
  "PROVISION_RESERVED", "PROVISION_COMMITTED", "PROVIDER_OUTCOME_UNKNOWN",
  "OWNERSHIP_CONFLICT", "STALE_FENCE", "RECONCILIATION_CONFIRMED",
  "DAY_ZERO_COMPLETE", "PROVISION_COMPENSATION_FENCED", "PROVISION_COMPENSATED",
] as const

// No free text, request body, provider message or additional property is accepted.
export const auditEventSchema = z.strictObject({
  eventId: opaqueIdSchema,
  requestId: opaqueIdSchema,
  commandId: opaqueIdSchema.optional(),
  identityId: opaqueIdSchema.optional(),
  eventType: z.enum(auditEventTypes),
  purpose: authorityPurposeSchema.optional(),
  generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  capability: userCapabilitySchema.optional(),
  outcome: z.enum(["ALLOW", "DENY", "SUCCESS", "FAILURE", "UNKNOWN"]),
  reasonCode: z.enum(auditReasonCodes),
  occurredAt: z.iso.datetime(),
  deployment: z.enum(["LOCAL", "LOCAL_PRODUCTION_LIKE", "STAGING", "PRODUCTION"]),
  contractVersion: z.literal("1.1"),
})
export type AuditEvent = z.infer<typeof auditEventSchema>
