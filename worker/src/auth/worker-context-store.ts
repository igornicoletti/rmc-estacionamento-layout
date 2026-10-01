import { z } from "zod"
import type { AuthContextStore, PersistedAuthContext } from "../../../src/shared/auth/auth-http-contracts"
import { isoTimestampSchema, opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { WorkerProblem } from "../http/worker-http"
import { createWorkerRpc } from "../http/worker-rpc"

const hash = z.string().regex(/^[0-9a-f]{64}$/)
const recordSchema = z.strictObject({
  codecVersion: z.literal(1), algorithm: z.literal("A256GCM"),
  contextId: opaqueIdSchema, purpose: z.literal("PREAUTH"),
  generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  expiresAt: isoTimestampSchema, serverTime: isoTimestampSchema,
  csrfHash: hash, bindingHash: hash,
  ciphertext: z.string().regex(/^[0-9a-f]{120}$/), keyVersion: z.number().int().positive(),
}).refine((value) => Date.parse(value.expiresAt) > Date.parse(value.serverTime), "Expired upstream context")

export function createContextStore(url: string, secret: string): AuthContextStore {
  const base = new URL(url)
  // F03 admits only the fixed, isolated local Supabase project.
  if (base.origin !== "http://127.0.0.1:55321" || base.pathname !== "/" || base.search || base.hash
    || base.username || base.password || !secret) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
  const rpc = createWorkerRpc(base.origin, secret, ["create_preauth_context", "read_preauth_context", "validate_preauth_csrf"])
  function record(value: unknown): PersistedAuthContext {
    const parsed = recordSchema.safeParse(value)
    if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    return parsed.data
  }
  const bytea = (value: string) => `\\x${value}`
  return {
    async create(input, signal) {
      const value = await rpc("create_preauth_context", {
        p_context_id: input.contextId, p_cookie_hash: bytea(input.cookieHash),
        p_csrf_hash: bytea(input.csrfHash), p_ciphertext: bytea(input.ciphertext),
        p_binding_hash: bytea(input.bindingHash), p_key_version: input.keyVersion, p_ip_hash: bytea(input.ipHash),
      }, signal)
      if (z.strictObject({ limited: z.literal(true) }).safeParse(value).success) return "limited"
      return record(value)
    },
    async read(cookieHash, signal) {
      const value = await rpc("read_preauth_context", { p_cookie_hash: bytea(cookieHash) }, signal)
      return value === null ? null : record(value)
    },
    async validate(contextId, generation, csrfHash, signal) {
      const value = await rpc("validate_preauth_csrf", {
        p_context_id: contextId, p_generation: generation, p_csrf_hash: bytea(csrfHash),
      }, signal)
      if (typeof value !== "boolean") throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return value
    },
  }
}
