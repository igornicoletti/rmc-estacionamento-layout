import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { authHttpPolicy } from "../../../src/shared/auth/auth-http-contracts"
import { authPolicy } from "../../../src/shared/auth/auth-policy"
import type { CommandContext } from "../../../src/shared/auth/auth-ports"
import { provisioningReservationSchema, type ProvisioningOutcome, type ProvisioningProvider, type ProvisioningReservation } from "../../../src/shared/auth/auth-provisioning"
import { httpDeadline, readHttpJson } from "../../../src/lib/http/http-stream"
import { WorkerProblem } from "../http/worker-http"
import { encodeSecret } from "./worker-crypto"

const contextSchema = z.strictObject({ commandId: opaqueIdSchema, requestId: opaqueIdSchema, signal: z.instanceof(AbortSignal) })
const ownershipSchema = z.strictObject({
  purpose: z.literal("PROVISION_IDENTITY"), contractVersion: z.literal("1.1"),
  commandId: opaqueIdSchema, identityId: opaqueIdSchema, ownershipBinding: opaqueIdSchema,
  identityGeneration: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})
// Provider DTOs can gain fields; ownership itself is closed and never comes from user_metadata.
const userSchema = z.object({
  id: opaqueIdSchema, email: z.string(), phone: z.string().optional(),
  phone_confirmed_at: z.string().nullable().optional(),
  app_metadata: z.object({ rmc_provisioning: ownershipSchema }),
})

export function provisioningOwnership(reservation: ProvisioningReservation) {
  return ownershipSchema.parse({ purpose: "PROVISION_IDENTITY", contractVersion: "1.1",
    commandId: reservation.commandId, identityId: reservation.identityId,
    ownershipBinding: reservation.ownershipBinding, identityGeneration: reservation.identityGeneration })
}

export function inspectProvisionedUser(value: unknown, reservation: ProvisioningReservation): ProvisioningOutcome {
  const parsed = userSchema.safeParse(value)
  if (!parsed.success) return { kind: "CONFLICT" }
  const user = parsed.data
  const expected = provisioningOwnership(reservation)
  const actual = user.app_metadata.rmc_provisioning
  if (user.id !== reservation.providerSubject || user.email !== `u-${reservation.providerSubject}@auth.rmc.invalid`
    || (user.phone !== undefined && user.phone !== "") || user.phone_confirmed_at
    || Object.keys(expected).some((key) => actual[key as keyof typeof actual] !== expected[key as keyof typeof expected])) return { kind: "CONFLICT" }
  return { kind: "OWNED", proof: { providerSubject: user.id, commandId: actual.commandId, ownershipBinding: actual.ownershipBinding } }
}

// First F04 milestone: local create/read only. No deletion, public route or Env wiring.
// The boundary must check the persistent reservation/lease/fence, not a caller clock.
export class WorkerProvisioningProvider implements Pick<ProvisioningProvider, "createReservedUser" | "getReservedUser"> {
  constructor(private readonly url: string, private readonly secret: string,
    private readonly admit: (reservation: ProvisioningReservation, context: CommandContext, mutation: boolean) => Promise<boolean>) {
    if (url !== "http://127.0.0.1:55321" || !secret) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
  }

  private async execute(input: ProvisioningReservation, rawContext: CommandContext, create: boolean): Promise<ProvisioningOutcome> {
    const reservation = provisioningReservationSchema.safeParse(input)
    const context = contextSchema.safeParse(rawContext)
    if (!reservation.success || !context.success || reservation.data.commandId !== context.data.commandId
      || reservation.data.state === "ABORTED" || (create && reservation.data.state !== "RESERVED")) return { kind: "CONFLICT" }
    const current = reservation.data
    const ctx = context.data
    if (ctx.signal.aborted) return { kind: "UNKNOWN" }
    try {
      if (!await this.admit(current, ctx, create)) return { kind: "UNKNOWN" }
      ctx.signal.throwIfAborted()
      const client = createClient(this.url, this.secret, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: async (input, init) => {
          const url = new URL(input instanceof Request ? input.url : String(input))
          const method = init?.method ?? (input instanceof Request ? input.method : "GET")
          const expected = create ? "/auth/v1/admin/users" : `/auth/v1/admin/users/${current.providerSubject}`
          if (url.origin !== this.url || url.pathname !== expected || url.search || url.hash || method !== (create ? "POST" : "GET")) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
          const deadline = httpDeadline(ctx.signal, authPolicy.upstreamAttemptTimeoutMs)
          try {
            const response = await fetch(input, { ...init, signal: deadline.signal, redirect: "manual" })
            if (response.status >= 300 && response.status < 400
              || response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
              void response.body?.cancel().catch(() => {})
              throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
            }
            const value = await readHttpJson(response.body, authHttpPolicy.rpcResponseBytes, deadline.signal)
            const version = response.headers.get("X-Supabase-Api-Version")
            return Response.json(value, { status: response.status,
              headers: version ? { "X-Supabase-Api-Version": version } : {} })
          } finally { deadline.dispose() }
        } },
      })
      const result = create
        ? await client.auth.admin.createUser({ id: current.providerSubject,
          email: `u-${current.providerSubject}@auth.rmc.invalid`,
          // Disposable internal credential, never returned, persisted or communicated.
          password: encodeSecret(crypto.getRandomValues(new Uint8Array(32))),
          email_confirm: true, phone_confirm: false,
          app_metadata: { rmc_provisioning: provisioningOwnership(current) } })
        : await client.auth.admin.getUserById(current.providerSubject)
      ctx.signal.throwIfAborted()
      if (result.error) {
        // Only an explicit lookup response can prove absence. Create failure is ambiguous.
        if (!create && result.error.status === 404 && result.error.code === "user_not_found") return { kind: "ABSENT" }
        return { kind: "UNKNOWN" }
      }
      if (!result.data.user) return { kind: "UNKNOWN" }
      return inspectProvisionedUser(result.data.user, current)
    } catch {
      // Timeouts, rejected payloads, network loss and admission failure never prove rollback/absence.
      return { kind: "UNKNOWN" }
    }
  }

  createReservedUser(reservation: ProvisioningReservation, context: CommandContext) { return this.execute(reservation, context, true) }
  getReservedUser(reservation: ProvisioningReservation, context: CommandContext) { return this.execute(reservation, context, false) }
}
