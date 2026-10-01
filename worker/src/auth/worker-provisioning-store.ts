import { z } from "zod"
import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import type { CommandContext } from "../../../src/shared/auth/auth-ports"
import { providerOwnershipSchema, provisioningReservationSchema, type ProvisioningDatabase, type ProvisioningReservation } from "../../../src/shared/auth/auth-provisioning"
import { WorkerProblem } from "../http/worker-http"
import { createWorkerRpc } from "../http/worker-rpc"

const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const time = z.iso.datetime({ offset: true })
const rowSchema = z.strictObject({
  command_id: opaqueIdSchema, identity_id: opaqueIdSchema, provider_subject: opaqueIdSchema,
  ownership_binding: opaqueIdSchema, identity_generation: positive, fence: positive,
  lease_owner: opaqueIdSchema, lease_expires_at: time,
  state: provisioningReservationSchema.shape.state, confirmed_at: time.nullable(), created_at: time,
  dispatch_claimed: z.boolean(),
  reconcile_attempts: z.number().int().min(0).max(8), next_reconcile_at: time, reconcile_deadline: time,
}).refine((value) => ["CONFIRMED", "COMMITTED"].includes(value.state) === (value.confirmed_at !== null))
const commandSchema = z.object({ commandId: opaqueIdSchema, requestId: opaqueIdSchema, signal: z.instanceof(AbortSignal) })

export function createProvisioningStore(url: string, secret: string): ProvisioningDatabase {
  const rpc = createWorkerRpc(url, secret, ["reserve_provider", "read_provider_reservation", "claim_provider_reconciliation",
    "record_provider_outcome", "commit_provider_reservation", "admit_provider_attempt"])
  function reservation(value: unknown, commandId: string): ProvisioningReservation | null {
    // PostgREST serializes composite return types as table-valued arrays.
    if (Array.isArray(value)) {
      if (value.length === 0) return null
      if (value.length !== 1) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      value = value[0]
    }
    if (value === null) return null
    const row = rowSchema.safeParse(value)
    if (!row.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    const r = row.data
    if (r.command_id !== commandId) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    return provisioningReservationSchema.parse({ commandId: r.command_id, identityId: r.identity_id,
      providerSubject: r.provider_subject, ownershipBinding: r.ownership_binding,
      identityGeneration: r.identity_generation, fence: r.fence, leaseOwner: r.lease_owner,
      leaseExpiresAt: new Date(r.lease_expires_at).toISOString(), state: r.state })
  }
  function bound(input: ProvisioningReservation, context: CommandContext) {
    const r = provisioningReservationSchema.safeParse(input)
    const c = commandSchema.safeParse(context)
    if (!r.success || !c.success || r.data.commandId !== c.data.commandId) throw new WorkerProblem("AUTH_INVALID_REQUEST")
    return { p_command: r.data.commandId, p_owner: r.data.leaseOwner, p_fence: r.data.fence,
      p_provider: r.data.providerSubject, p_binding: r.data.ownershipBinding }
  }
  async function bool(name: string, args: Record<string, string | number | boolean>, context: CommandContext) {
    const value = await rpc(name, args, context.signal)
    if (typeof value !== "boolean") throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    return value
  }
  function command(commandId: string, context: CommandContext) {
    if (!commandSchema.safeParse(context).success || context.commandId !== commandId) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  }
  return {
    async reserve(commandId, generation, owner, context) {
      command(commandId, context)
      if (!positive.safeParse(generation).success || !opaqueIdSchema.safeParse(owner).success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
      const result = reservation(await rpc("reserve_provider", { p_command: commandId, p_generation: generation, p_owner: owner }, context.signal), commandId)
      if (!result || result.identityGeneration !== generation) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return result
    },
    async readReservation(commandId, context) {
      if (!opaqueIdSchema.safeParse(commandId).success || !(context.signal instanceof AbortSignal)) throw new WorkerProblem("AUTH_INVALID_REQUEST")
      return reservation(await rpc("read_provider_reservation", { p_command: commandId }, context.signal), commandId)
    },
    async claimReconciliation(commandId, owner, context) {
      command(commandId, context)
      if (!opaqueIdSchema.safeParse(owner).success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
      const result = reservation(await rpc("claim_provider_reconciliation", { p_command: commandId, p_owner: owner }, context.signal), commandId)
      if (result && result.leaseOwner !== owner) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      return result
    },
    async confirmOwnership(input, proof, context) {
      const args = bound(input, context)
      const p = providerOwnershipSchema.safeParse(proof)
      if (!p.success || p.data.commandId !== input.commandId || p.data.providerSubject !== input.providerSubject
        || p.data.ownershipBinding !== input.ownershipBinding) return false
      return await bool("record_provider_outcome", { ...args, p_outcome: "OWNED" }, context)
    },
    async commit(input, context) {
      const args = bound(input, context)
      return await bool("commit_provider_reservation", { p_command: args.p_command, p_owner: args.p_owner,
        p_fence: args.p_fence, p_request: context.requestId, p_deployment: "LOCAL" }, context)
    },
    async abortConfirmedAbsent(input, context) {
      // Not usable for ambiguous external calls; no automatic abort from GET404.
      return await bool("record_provider_outcome", { ...bound(input, context), p_outcome: "ABSENT" }, context)
    },
    async recordUnknown(input, context) {
      return await bool("record_provider_outcome", { ...bound(input, context), p_outcome: "UNKNOWN" }, context)
    },
    async admit(input, context, mutation) {
      return await bool("admit_provider_attempt", { ...bound(input, context), p_generation: input.identityGeneration, p_mutation: mutation }, context)
    },
  }
}
