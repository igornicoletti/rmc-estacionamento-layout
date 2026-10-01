import { z } from "zod"
import { AUTH_CONTRACT_VERSION, authorityPurposeSchema, isoTimestampSchema, opaqueIdSchema } from "./auth-contracts"
import { AUTH_POLICY_VERSION } from "./auth-policy"

// ADR-003: bounded transport, not additional normative Auth lifetimes.
export const authHttpPolicy = Object.freeze({
  version: "auth-http-v1", responseBytes: 16 * 1024, rpcResponseBytes: 64 * 1024,
  browserBudgetMs: 30_000, bootstrapIpPerMinute: 60, bootstrapGlobalPerMinute: 600,
})
export const authSecretSchema = z.string().regex(/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/)
export const authContextResponseSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  policyVersion: z.literal(AUTH_POLICY_VERSION),
  serverTime: isoTimestampSchema,
  contextId: opaqueIdSchema,
  authority: z.strictObject({
    purpose: authorityPurposeSchema,
    generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    expiresAt: isoTimestampSchema,
  }),
  csrfToken: authSecretSchema,
}).refine((value) => Date.parse(value.authority.expiresAt) > Date.parse(value.serverTime), "Expired Auth context")
export type AuthContextResponse = z.infer<typeof authContextResponseSchema>

export const authEndpoints = Object.freeze({
  context: { method: "GET", path: "/api/auth/context", response: authContextResponseSchema },
  health: { method: "GET", path: "/api/health", response: z.strictObject({ status: z.literal("ok") }) },
} as const)

export interface PersistedAuthContext {
  codecVersion: 1
  algorithm: "A256GCM"
  contextId: string
  purpose: "PREAUTH"
  generation: number
  expiresAt: string
  serverTime: string
  csrfHash: string
  ciphertext: string
  bindingHash: string
  keyVersion: number
}
export interface AuthContextStore {
  create(input: {
    contextId: string; cookieHash: string; csrfHash: string; ciphertext: string;
    bindingHash: string; keyVersion: number; ipHash: string;
  }, signal: AbortSignal): Promise<PersistedAuthContext | "limited">
  read(cookieHash: string, signal: AbortSignal): Promise<PersistedAuthContext | null>
  validate(contextId: string, generation: number, csrfHash: string, signal: AbortSignal): Promise<boolean>
}
