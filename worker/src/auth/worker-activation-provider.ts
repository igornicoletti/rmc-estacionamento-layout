import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { authHttpPolicy } from "../../../src/shared/auth/auth-http-contracts"
import { authPolicy } from "../../../src/shared/auth/auth-policy"
import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { httpDeadline, readHttpJson } from "../../../src/lib/http/http-stream"
import { WorkerProblem } from "../http/worker-http"

const ownershipSchema = z.strictObject({
  purpose: z.literal("PROVISION_IDENTITY"), contractVersion: z.literal("1.1"),
  commandId: opaqueIdSchema, identityId: opaqueIdSchema, ownershipBinding: opaqueIdSchema,
  identityGeneration: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})
const userSchema = z.object({
  id: opaqueIdSchema, email: z.string(), phone: z.string().nullable().optional(),
  phone_confirmed_at: z.string().nullable().optional(),
  app_metadata: z.object({ rmc_provisioning: ownershipSchema }),
})
export interface ActivationProviderClaim {
  identityId: string; providerSubject: string; reservationCommand: string;
  ownershipBinding: string; generation: number;
}
export function ownedActivationUser(value: unknown, claim: ActivationProviderClaim): boolean {
  const parsed = userSchema.safeParse(value)
  if (!parsed.success) return false
  const user = parsed.data
  const metadata = user.app_metadata.rmc_provisioning
  return user.id === claim.providerSubject
    && user.email === `u-${claim.providerSubject}@auth.rmc.invalid`
    && (!user.phone || user.phone === "") && !user.phone_confirmed_at
    && metadata.commandId === claim.reservationCommand && metadata.identityId === claim.identityId
    && metadata.ownershipBinding === claim.ownershipBinding
    && metadata.identityGeneration === claim.generation
}

export class WorkerActivationProvider {
  constructor(private readonly url: string, private readonly secret: string,
    private readonly transport: typeof fetch = fetch) {
    if (url !== "http://127.0.0.1:55321" || !secret) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
  }
  async provePassword(claim: ActivationProviderClaim, password: string, signal: AbortSignal): Promise<{
    accessToken: string; expiresAt: string;
  }> {
    const client = createClient(this.url, this.secret, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: async (input, init) => {
        const target = new URL(input instanceof Request ? input.url : String(input))
        const method = init?.method ?? (input instanceof Request ? input.method : "GET")
        const userPath = `/auth/v1/admin/users/${claim.providerSubject}`
        const allowed = target.origin === this.url && !target.hash
          && (target.pathname === userPath && !target.search && ["GET", "PUT"].includes(method)
            || target.pathname === "/auth/v1/token" && target.search === "?grant_type=password" && method === "POST")
        if (!allowed) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
        const deadline = httpDeadline(signal, authPolicy.upstreamAttemptTimeoutMs)
        try {
          const response = await this.transport(input, { ...init, redirect: "manual", signal: deadline.signal })
          if (response.status >= 300 && response.status < 400
            || response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
            void response.body?.cancel().catch(() => {})
            throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
          }
          const data = await readHttpJson(response.body, authHttpPolicy.rpcResponseBytes, deadline.signal)
          const version = response.headers.get("X-Supabase-Api-Version")
          return Response.json(data, { status: response.status,
            headers: version ? { "X-Supabase-Api-Version": version } : {} })
        } finally { deadline.dispose() }
      } },
    })
    const observed = await client.auth.admin.getUserById(claim.providerSubject)
    signal.throwIfAborted()
    if (observed.error || !ownedActivationUser(observed.data.user, claim)) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    const email = `u-${claim.providerSubject}@auth.rmc.invalid`
    let signed = await client.auth.signInWithPassword({ email, password })
    signal.throwIfAborted()
    if (signed.error) {
      // Only a definite password mismatch authorizes an admin update. Any
      // outage or ambiguous response remains restricted for reconciliation.
      if (signed.error.code !== "invalid_credentials") throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      const updated = await client.auth.admin.updateUserById(claim.providerSubject, { password })
      signal.throwIfAborted()
      if (updated.error || !ownedActivationUser(updated.data.user, claim)) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      signed = await client.auth.signInWithPassword({ email, password })
      signal.throwIfAborted()
    }
    if (signed.error || !ownedActivationUser(signed.data.user, claim)
      || !signed.data.session?.access_token || !signed.data.session.expires_at
      || signed.data.session.expires_at * 1000 <= Date.now() + 5 * 60_000) {
      throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    }
    return { accessToken: signed.data.session.access_token,
      expiresAt: new Date(signed.data.session.expires_at * 1000).toISOString() }
  }
}
