import { z } from "zod"
import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { authRoleSchema } from "../../../src/shared/auth/auth-contracts"
import { createWorkerRpc } from "../http/worker-rpc"
import { WorkerProblem } from "../http/worker-http"

const hash = z.string().regex(/^[0-9a-f]{64}$/)
const candidateSchema = z.strictObject({ identityId: opaqueIdSchema,
  generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) })
const acceptedSchema = z.strictObject({ accepted: z.literal(true),
  challengeId: opaqueIdSchema, expiresAt: z.iso.datetime({ offset: true }) })
const journeySchema = z.strictObject({ step: z.literal("OTP_REQUIRED"), challengeId: opaqueIdSchema,
  journeyId: opaqueIdSchema, identityId: opaqueIdSchema.nullable(),
  generation: z.number().int().positive(), contextKeyVersion: z.number().int().positive(),
  expiresAt: z.iso.datetime({ offset: true }), journeyExpiresAt: z.iso.datetime({ offset: true }) })
const resentSchema = acceptedSchema.extend({ journeyExpiresAt: z.iso.datetime({ offset: true }) })
const verifyReplaySchema = z.strictObject({ sessionId: opaqueIdSchema,
  expiresAt: z.iso.datetime({ offset: true }), contextKeyVersion: z.number().int().positive() })
const bootstrapStatusSchema = z.strictObject({ step: z.enum(["PASSWORD_REQUIRED", "SECURITY_SETUP"]) })
const limitedSchema = z.strictObject({ limited: z.literal(true) })
const challengeSchema = z.strictObject({
  journeyId: opaqueIdSchema, challengeId: opaqueIdSchema, identityId: opaqueIdSchema.nullable(),
  generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  expiresAt: z.iso.datetime({ offset: true }), keyVersion: z.number().int().positive(),
})
const replaySchema = z.strictObject({
  journeyId: opaqueIdSchema, challengeId: opaqueIdSchema,
  expiresAt: z.iso.datetime({ offset: true }), contextKeyVersion: z.number().int().positive(),
})
const passwordClaimSchema = z.strictObject({
  claimed: z.literal(true), identityId: opaqueIdSchema, sessionId: opaqueIdSchema,
  providerSubject: opaqueIdSchema, reservationCommand: opaqueIdSchema,
  ownershipBinding: opaqueIdSchema,
  generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  fence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})
const passwordProvedSchema = z.strictObject({
  proved: z.literal(true), identityId: opaqueIdSchema, sessionId: opaqueIdSchema,
})
const setupSchema = z.strictObject({
  identityId: opaqueIdSchema, sessionId: opaqueIdSchema,
  providerSubject: opaqueIdSchema, generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  role: authRoleSchema, reservationCommand: opaqueIdSchema, ownershipBinding: opaqueIdSchema,
  ciphertext: z.string().regex(/^(?:[0-9a-f]{2}){100,8192}$/),
  keyVersion: z.number().int().positive(), providerExpiresAt: z.iso.datetime({ offset: true }),
  factorId: opaqueIdSchema.nullable(), factorState: z.enum(["CLAIMED", "ENROLLED", "RECOVERING", "VERIFIED"]).nullable(),
})
const totpClaimSchema = z.strictObject({
  claimed: z.literal(true), identityId: opaqueIdSchema, sessionId: opaqueIdSchema,
  generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  fence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})
const recoveryClaimSchema = totpClaimSchema.extend({ previousCommand: opaqueIdSchema,
  factorId: opaqueIdSchema.nullable() })
const completionSchema = z.strictObject({
  normalSessionId: opaqueIdSchema, expiresAt: z.iso.datetime({ offset: true }),
  idleExpiresAt: z.iso.datetime({ offset: true }),
  contextKeyVersion: z.number().int().positive(), role: authRoleSchema,
  contextVersion: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})
const bytea = (value: string) => `\\x${hash.parse(value)}`

export function createActivationStore(url: string, secret: string) {
  const rpc = createWorkerRpc(url, secret, [
    "activation_candidate", "begin_activation", "replay_activation", "read_activation_challenge", "verify_activation",
    "cancel_activation",
    "claim_activation_password", "prove_activation_password",
    "read_activation_security_setup", "claim_activation_totp", "record_activation_totp",
    "complete_activation", "replay_activation_completion",
    "read_activation_journey", "resend_activation", "replay_activation_verify", "verify_activation_once",
    "read_activation_bootstrap_status",
    "claim_activation_totp_recovery", "finish_activation_totp_recovery",
  ])
  return {
    async claimTotpRecovery(input: { cookieHash: string; csrfHash: string;
      commandId: string; owner: string }, signal: AbortSignal) {
      const value = await rpc("claim_activation_totp_recovery", {
        p_cookie: bytea(input.cookieHash), p_csrf: bytea(input.csrfHash),
        p_command: input.commandId, p_owner: input.owner,
      }, signal)
      if (value === null) return null
      if (z.strictObject({ busy: z.literal(true) }).safeParse(value).success) return { busy: true as const }
      const parsed = recoveryClaimSchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async finishTotpRecovery(input: { identityId: string; sessionId: string;
      commandId: string; owner: string; fence: number }, signal: AbortSignal) {
      const value = await rpc("finish_activation_totp_recovery", {
        p_identity: input.identityId, p_session: input.sessionId, p_command: input.commandId,
        p_owner: input.owner, p_fence: input.fence,
      }, signal)
      if (typeof value !== "boolean") throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return value
    },
    async bootstrapStatus(cookieHash: string, csrfHash: string, signal: AbortSignal) {
      const value = await rpc("read_activation_bootstrap_status",
        { p_cookie: bytea(cookieHash), p_csrf: bytea(csrfHash) }, signal)
      if (value === null) return null
      const parsed = bootstrapStatusSchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async replayVerify(input: { cookieHash: string; csrfHash: string; commandId: string;
      challengeId: string; intentHash: string }, signal: AbortSignal) {
      const value = await rpc("replay_activation_verify", {
        p_cookie: bytea(input.cookieHash), p_csrf: bytea(input.csrfHash),
        p_command: input.commandId, p_challenge: input.challengeId, p_intent: bytea(input.intentHash),
      }, signal)
      if (value === null) return null
      const parsed = verifyReplaySchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async readJourney(cookieHash: string, csrfHash: string, signal: AbortSignal) {
      const value = await rpc("read_activation_journey", { p_cookie: bytea(cookieHash), p_csrf: bytea(csrfHash) }, signal)
      if (value === null) return null
      const parsed = journeySchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async resend(input: { cookieHash: string; csrfHash: string; commandId: string; challengeId: string;
      verifierHash: string; verifierKeyVersion: number; ciphertext: string; deliveryKeyVersion: number;
      expiresAt: string; outboxId: string }, signal: AbortSignal) {
      const value = await rpc("resend_activation", {
        p_cookie: bytea(input.cookieHash), p_csrf: bytea(input.csrfHash), p_command: input.commandId,
        p_challenge: input.challengeId, p_verifier: bytea(input.verifierHash),
        p_verifier_key: input.verifierKeyVersion, p_ciphertext: `\\x${input.ciphertext}`,
        p_delivery_key: input.deliveryKeyVersion, p_expires: input.expiresAt, p_outbox: input.outboxId,
      }, signal)
      if (value === null) return null
      const parsed = resentSchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async replay(commandId: string, preauthCookieHash: string, preauthCsrfHash: string,
      intentHash: string, signal: AbortSignal) {
      const value = await rpc("replay_activation", {
        p_command: commandId, p_preauth_cookie: bytea(preauthCookieHash),
        p_preauth_csrf: bytea(preauthCsrfHash), p_intent: bytea(intentHash),
      }, signal)
      if (value === null) return null
      const parsed = replaySchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async candidate(lookups: readonly { keyVersion: number; hash: string }[], signal: AbortSignal) {
      const value = await rpc("activation_candidate", {
        p_versions: lookups.map((item) => item.keyVersion),
        p_hashes: lookups.map((item) => bytea(item.hash)),
      }, signal)
      if (value === null) return null
      const parsed = candidateSchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async begin(input: {
      commandId: string; preauthId: string; preauthCookieHash: string; preauthCsrfHash: string;
      intentHash: string; ipHash: string; lookups: readonly { keyVersion: number; hash: string }[];
      expectedIdentityId: string | null; expectedGeneration: number | null;
      journeyId: string; journeyCookieHash: string; bindingHash: string; csrfHash: string;
      csrfCiphertext: string; contextKeyVersion: number; challengeId: string;
      verifierHash: string; verifierKeyVersion: number; ciphertext: string;
      deliveryKeyVersion: number; challengeExpiresAt: string; outboxId: string;
    }, signal: AbortSignal) {
      const value = await rpc("begin_activation", {
        p_command: input.commandId, p_preauth: input.preauthId,
        p_preauth_cookie: bytea(input.preauthCookieHash), p_preauth_csrf: bytea(input.preauthCsrfHash),
        p_intent: bytea(input.intentHash), p_ip_hash: bytea(input.ipHash),
        p_versions: input.lookups.map((item) => item.keyVersion),
        p_hashes: input.lookups.map((item) => bytea(item.hash)),
        p_expected_identity: input.expectedIdentityId, p_expected_generation: input.expectedGeneration,
        p_journey: input.journeyId, p_journey_cookie: bytea(input.journeyCookieHash),
        p_binding: bytea(input.bindingHash), p_csrf_hash: bytea(input.csrfHash),
        p_csrf_ciphertext: `\\x${input.csrfCiphertext}`, p_context_key: input.contextKeyVersion,
        p_challenge: input.challengeId, p_verifier: bytea(input.verifierHash),
        p_verifier_key: input.verifierKeyVersion, p_ciphertext: `\\x${input.ciphertext}`,
        p_delivery_key: input.deliveryKeyVersion, p_challenge_expires: input.challengeExpiresAt,
        p_outbox: input.outboxId,
      }, signal)
      if (limitedSchema.safeParse(value).success) return { limited: true as const }
      const accepted = acceptedSchema.safeParse(value)
      if (!accepted.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return accepted.data
    },
    async readChallenge(cookieHash: string, csrfHash: string, challengeId: string, signal: AbortSignal) {
      const value = await rpc("read_activation_challenge", {
        p_cookie: bytea(cookieHash), p_csrf: bytea(csrfHash), p_challenge: challengeId,
      }, signal)
      if (value === null) return null
      const parsed = challengeSchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async verify(input: {
      cookieHash: string; csrfHash: string; challengeId: string; verifierHash: string;
      commandId: string; intentHash: string;
      sessionId: string; sessionCookieHash: string; sessionCsrfHash: string;
      sessionCsrfCiphertext: string; sessionBindingHash: string; contextKeyVersion: number; requestId: string;
    }, signal: AbortSignal) {
      const value = await rpc("verify_activation_once", {
        p_cookie: bytea(input.cookieHash), p_csrf: bytea(input.csrfHash), p_challenge: input.challengeId,
        p_verifier: bytea(input.verifierHash), p_bootstrap_session: input.sessionId,
        p_bootstrap_cookie: bytea(input.sessionCookieHash), p_bootstrap_csrf: bytea(input.sessionCsrfHash),
        p_bootstrap_csrf_ciphertext: `\\x${input.sessionCsrfCiphertext}`,
        p_bootstrap_binding: bytea(input.sessionBindingHash),
        p_context_key: input.contextKeyVersion, p_request: input.requestId,
        p_command: input.commandId, p_intent: bytea(input.intentHash),
      }, signal)
      if (typeof value !== "boolean") throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return value
    },
    async cancel(cookieHash: string, csrfHash: string, requestId: string, signal: AbortSignal) {
      const value = await rpc("cancel_activation", {
        p_cookie: bytea(cookieHash), p_csrf: bytea(csrfHash), p_request: requestId,
      }, signal)
      if (typeof value !== "boolean") throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return value
    },
    async claimPassword(input: { cookieHash: string; csrfHash: string; commandId: string;
      intentHash: string; owner: string }, signal: AbortSignal) {
      const value = await rpc("claim_activation_password", {
        p_cookie: bytea(input.cookieHash), p_csrf: bytea(input.csrfHash),
        p_command: input.commandId, p_intent: bytea(input.intentHash), p_owner: input.owner,
      }, signal)
      if (value === null) return null
      if (z.strictObject({ busy: z.literal(true) }).safeParse(value).success) return { busy: true as const }
      const proved = passwordProvedSchema.safeParse(value)
      if (proved.success) return proved.data
      const claimed = passwordClaimSchema.safeParse(value)
      if (!claimed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return claimed.data
    },
    async provePassword(input: { identityId: string; sessionId: string; commandId: string;
      owner: string; fence: number; providerSubject: string; ciphertext: string;
      keyVersion: number; accessExpiresAt: string; requestId: string }, signal: AbortSignal) {
      const value = await rpc("prove_activation_password", {
        p_identity: input.identityId, p_session: input.sessionId, p_command: input.commandId,
        p_owner: input.owner, p_fence: input.fence, p_provider: input.providerSubject,
        p_ciphertext: `\\x${input.ciphertext}`, p_key_version: input.keyVersion,
        p_provider_expires: input.accessExpiresAt, p_request: input.requestId,
      }, signal)
      if (typeof value !== "boolean") throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return value
    },
    async readSecuritySetup(cookieHash: string, csrfHash: string, signal: AbortSignal) {
      const value = await rpc("read_activation_security_setup", {
        p_cookie: bytea(cookieHash), p_csrf: bytea(csrfHash),
      }, signal)
      if (value === null) return null
      const parsed = setupSchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async claimTotp(input: { cookieHash: string; csrfHash: string;
      commandId: string; owner: string }, signal: AbortSignal) {
      const value = await rpc("claim_activation_totp", {
        p_cookie: bytea(input.cookieHash), p_csrf: bytea(input.csrfHash),
        p_command: input.commandId, p_owner: input.owner,
      }, signal)
      if (value === null) return null
      if (z.strictObject({ busy: z.literal(true) }).safeParse(value).success) return { busy: true as const }
      const parsed = totpClaimSchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async recordTotp(input: { identityId: string; sessionId: string; commandId: string;
      owner: string; fence: number; factorId: string; requestId: string }, signal: AbortSignal) {
      const value = await rpc("record_activation_totp", {
        p_identity: input.identityId, p_session: input.sessionId, p_command: input.commandId,
        p_owner: input.owner, p_fence: input.fence, p_factor: input.factorId,
        p_request: input.requestId,
      }, signal)
      if (typeof value !== "boolean") throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return value
    },
    async replayCompletion(input: { commandId: string; cookieHash: string; csrfHash: string;
      intentHash: string }, signal: AbortSignal) {
      const value = await rpc("replay_activation_completion", {
        p_command: input.commandId, p_bootstrap_cookie: bytea(input.cookieHash),
        p_bootstrap_csrf: bytea(input.csrfHash), p_intent: bytea(input.intentHash),
      }, signal)
      if (value === null) return null
      const parsed = completionSchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
    async complete(input: { cookieHash: string; csrfHash: string; commandId: string;
      intentHash: string; providerSubject: string; factorId: string | null;
      assurance: "aal1" | "aal2"; providerCiphertext: string; providerKeyVersion: number;
      providerExpiresAt: string; normalSessionId: string; normalCookieHash: string;
      normalCsrfHash: string; normalCsrfCiphertext: string; normalBindingHash: string;
      contextKeyVersion: number; requestId: string }, signal: AbortSignal) {
      const value = await rpc("complete_activation", {
        p_bootstrap_cookie: bytea(input.cookieHash), p_bootstrap_csrf: bytea(input.csrfHash),
        p_command: input.commandId, p_intent: bytea(input.intentHash),
        p_provider: input.providerSubject, p_factor: input.factorId, p_assurance: input.assurance,
        p_provider_ciphertext: `\\x${input.providerCiphertext}`,
        p_provider_key: input.providerKeyVersion, p_provider_expires: input.providerExpiresAt,
        p_normal_session: input.normalSessionId, p_normal_cookie: bytea(input.normalCookieHash),
        p_normal_csrf: bytea(input.normalCsrfHash),
        p_normal_csrf_ciphertext: `\\x${input.normalCsrfCiphertext}`,
        p_normal_binding: bytea(input.normalBindingHash),
        p_context_key: input.contextKeyVersion, p_request: input.requestId,
      }, signal)
      if (value === null) return null
      const parsed = completionSchema.safeParse(value)
      if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return parsed.data
    },
  }
}
