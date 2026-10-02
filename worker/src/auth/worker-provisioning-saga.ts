import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import type { CommandContext } from "../../../src/shared/auth/auth-ports"
import { provisioningOutcomeSchema, provisioningReservationSchema, type ProvisioningDatabase, type ProvisioningOutcome, type ProvisioningProvider, type ProvisioningReservation } from "../../../src/shared/auth/auth-provisioning"

export type ProvisioningSagaResult =
  | { kind: "COMMITTED"; identityId: string }
  | { kind: "PENDING" }
  | { kind: "CONFLICT" }
  | { kind: "ABORTED" }

// Command has already been claimed/authorized by a controlled server boundary.
// No HTTP DTO/caller authority, retry loop, deletion or distributed transaction here.
export class WorkerProvisioningSaga {
  constructor(private readonly database: ProvisioningDatabase,
    private readonly provider: Pick<ProvisioningProvider, "createReservedUser" | "getReservedUser">) {}

  private binding(value: unknown, commandId: string): ProvisioningReservation | null {
    const parsed = provisioningReservationSchema.safeParse(value)
    return parsed.success && parsed.data.commandId === commandId ? parsed.data : null
  }

  private async resolve(reservation: ProvisioningReservation, context: CommandContext, create: boolean, observed?: ProvisioningOutcome): Promise<ProvisioningSagaResult> {
    if (reservation.state === "COMMITTED") return { kind: "COMMITTED", identityId: reservation.identityId }
    if (reservation.state === "ABORTED") return { kind: "ABORTED" }
    if (context.signal.aborted) return { kind: "PENDING" }
    try {
      // Adapter admission consumes persistent dispatch permission. Reconciliation only reads.
      const result = provisioningOutcomeSchema.safeParse(observed ?? await (create
        ? this.provider.createReservedUser(reservation, context)
        : this.provider.getReservedUser(reservation, context)))
      if (context.signal.aborted) return { kind: "PENDING" }
      if (!result.success || result.data.kind === "UNKNOWN" || result.data.kind === "ABSENT") {
        // A 404 can race a previously dispatched create still executing externally.
        await this.database.recordUnknown(reservation, context)
        return { kind: "PENDING" }
      }
      if (result.data.kind === "CONFLICT") return await this.conflict(reservation, context)
      const proof = result.data.proof
      if (proof.providerSubject !== reservation.providerSubject || proof.commandId !== reservation.commandId
        || proof.ownershipBinding !== reservation.ownershipBinding) return await this.conflict(reservation, context)
      if (!await this.database.confirmOwnership(reservation, proof, context)) return { kind: "PENDING" }
      context.signal.throwIfAborted()
      if (await this.database.commit(reservation, context)) return { kind: "COMMITTED", identityId: reservation.identityId }
      return { kind: "PENDING" }
    } catch {
      // No failure means rollback/absence. Durable reservation survives crash/cancel/failure.
      return { kind: "PENDING" }
    }
  }

  private async conflict(reservation: ProvisioningReservation, context: CommandContext): Promise<ProvisioningSagaResult> {
    return { kind: await this.database.recordConflict(reservation, context) ? "CONFLICT" : "PENDING" }
  }

  async start(commandId: string, identityGeneration: number, owner: string, context: CommandContext): Promise<ProvisioningSagaResult> {
    if (!opaqueIdSchema.safeParse(commandId).success || !opaqueIdSchema.safeParse(owner).success
      || !opaqueIdSchema.safeParse(context.requestId).success || context.commandId !== commandId
      || !Number.isSafeInteger(identityGeneration) || identityGeneration < 1) return { kind: "CONFLICT" }
    if (context.signal.aborted) return { kind: "PENDING" }
    try {
      const reservation = this.binding(await this.database.reserve(commandId, identityGeneration, owner, context), commandId)
      if (!reservation || reservation.identityGeneration !== identityGeneration) return { kind: "CONFLICT" }
      // A replay must never trigger a second create, even when the lease owner is unchanged.
      if (reservation.state === "COMMITTED" || reservation.state === "ABORTED") return await this.resolve(reservation, context, false)
      if (reservation.leaseOwner !== owner) return { kind: "PENDING" }
      const read = provisioningOutcomeSchema.safeParse(await this.provider.getReservedUser(reservation, context))
      if (!read.success) return await this.resolve(reservation, context, false, { kind: "UNKNOWN" })
      if (read.data.kind !== "ABSENT" || reservation.state !== "RESERVED" || reservation.leaseOwner !== owner) return await this.resolve(reservation, context, false, read.data)
      // Only the first persistent dispatch admission can authorize this call.
      // Reconciliation attempts are always separate and lookup-only.
      return await this.resolve(reservation, context, true)
    } catch { return { kind: "PENDING" } }
  }

  async reconcile(commandId: string, owner: string, context: CommandContext): Promise<ProvisioningSagaResult> {
    if (!opaqueIdSchema.safeParse(commandId).success || !opaqueIdSchema.safeParse(owner).success
      || !opaqueIdSchema.safeParse(context.requestId).success || context.commandId !== commandId) return { kind: "CONFLICT" }
    if (context.signal.aborted) return { kind: "PENDING" }
    try {
      const current = this.binding(await this.database.readReservation(commandId, context), commandId)
      if (!current) return { kind: "CONFLICT" }
      if (current.state === "COMMITTED") return { kind: "COMMITTED", identityId: current.identityId }
      if (current.state === "ABORTED") return { kind: "ABORTED" }
      const claimed = await this.database.claimReconciliation(commandId, owner, context)
      if (claimed === null) return { kind: "PENDING" }
      const reservation = this.binding(claimed, commandId)
      if (!reservation || reservation.leaseOwner !== owner) return { kind: "CONFLICT" }
      return await this.resolve(reservation, context, false)
    } catch { return { kind: "PENDING" } }
  }
}
