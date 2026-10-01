import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import type { AuthContextStore, PersistedAuthContext } from "../../../src/shared/auth/auth-http-contracts"
import { authHttpPolicy } from "../../../src/shared/auth/auth-http-contracts"
import { isoTimestampSchema, opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { authPolicy } from "../../../src/shared/auth/auth-policy"
import { httpDeadline, readHttpBytes } from "../../../src/lib/http/http-stream"
import { WorkerProblem } from "../http/worker-http"

const hash = z.string().regex(/^[0-9a-f]{64}$/)
const recordSchema = z.strictObject({
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
  const client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { schema: "rmc_auth_api" },
    global: { fetch: async (input, init) => {
      const target = new URL(input instanceof Request ? input.url : String(input))
      if (target.origin !== base.origin || !target.pathname.startsWith("/rest/v1/rpc/")) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
      const deadline = httpDeadline(init?.signal ?? undefined, authPolicy.upstreamAttemptTimeoutMs)
      try {
        // Workers supports follow/manual, not redirect:error. Never follow Location.
        const response = await fetch(input, { ...init, redirect: "manual", signal: deadline.signal })
        if (response.status >= 300 && response.status < 400) {
          void response.body?.cancel().catch(() => {})
          throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
        }
        if (response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
          void response.body?.cancel().catch(() => {})
          throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
        }
        const bytes = await readHttpBytes(response.body, authHttpPolicy.rpcResponseBytes, deadline.signal)
        try { JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes)) }
        catch { throw new WorkerProblem("AUTH_PROVIDER_FAILURE") }
        return new Response(bytes, { status: response.status, headers: response.headers })
      } catch (error) {
        if (error instanceof WorkerProblem) throw error
        if (deadline.timedOut()) throw new WorkerProblem("AUTH_DEPENDENCY_TIMEOUT")
        if (init?.signal?.aborted) throw new WorkerProblem("AUTH_DEPENDENCY_TIMEOUT")
        throw new WorkerProblem(error instanceof RangeError ? "AUTH_PROVIDER_FAILURE" : "AUTH_DEPENDENCY_UNAVAILABLE")
      } finally { deadline.dispose() }
    } },
  })
  async function rpc(name: string, args: Record<string, string | number>, signal: AbortSignal): Promise<unknown> {
    try {
      const result = await client.rpc(name, args).abortSignal(signal).throwOnError()
      const data: unknown = result.data
      return data
    } catch (error) {
      if (error instanceof WorkerProblem) throw error
      const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined
      throw new WorkerProblem(code === "22023" ? "AUTH_INVALID_REQUEST" : "AUTH_DEPENDENCY_UNAVAILABLE")
    }
  }
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
