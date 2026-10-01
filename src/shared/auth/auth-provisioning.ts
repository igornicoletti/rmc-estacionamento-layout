import { z } from "zod"

import { opaqueIdSchema } from "./auth-contracts"
import type { Abortable, CommandContext } from "./auth-ports"

const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
export const provisioningReservationSchema = z.strictObject({
  commandId: opaqueIdSchema,
  identityId: opaqueIdSchema,
  providerSubject: opaqueIdSchema,
  ownershipBinding: opaqueIdSchema,
  identityGeneration: positive,
  fence: positive,
  leaseOwner: opaqueIdSchema,
  leaseExpiresAt: z.iso.datetime(),
  state: z.enum(["RESERVED", "UNKNOWN", "CONFIRMED", "COMMITTED", "ABORTED"]),
})
export type ProvisioningReservation = z.infer<typeof provisioningReservationSchema>

export const providerOwnershipSchema = z.strictObject({
  providerSubject: opaqueIdSchema,
  commandId: opaqueIdSchema,
  ownershipBinding: opaqueIdSchema,
})
export type ProviderOwnership = z.infer<typeof providerOwnershipSchema>

export const provisioningOutcomeSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("OWNED"), proof: providerOwnershipSchema }),
  z.strictObject({ kind: z.literal("ABSENT") }),
  z.strictObject({ kind: z.literal("CONFLICT") }),
  z.strictObject({ kind: z.literal("UNKNOWN") }),
])
export type ProvisioningOutcome = z.infer<typeof provisioningOutcomeSchema>

// These are server ports, not public commands, endpoints or an authorization decision.
export interface ProvisioningProvider {
  createReservedUser(reservation: ProvisioningReservation, context: CommandContext): Promise<ProvisioningOutcome>
  getReservedUser(reservation: ProvisioningReservation, context: CommandContext): Promise<ProvisioningOutcome>
  deleteOwnedUser(reservation: ProvisioningReservation, proof: ProviderOwnership, context: CommandContext): Promise<"DELETED" | "UNKNOWN" | "CONFLICT">
}

export interface ProvisioningDatabase {
  reserve(commandId: string, identityGeneration: number, owner: string, context: CommandContext): Promise<ProvisioningReservation>
  readReservation(commandId: string, context: Abortable): Promise<ProvisioningReservation | null>
  claimReconciliation(commandId: string, owner: string, context: CommandContext): Promise<ProvisioningReservation | null>
  confirmOwnership(reservation: ProvisioningReservation, proof: ProviderOwnership, context: CommandContext): Promise<boolean>
  commit(reservation: ProvisioningReservation, context: CommandContext): Promise<boolean>
  abortConfirmedAbsent(reservation: ProvisioningReservation, context: CommandContext): Promise<boolean>
  admit(reservation: ProvisioningReservation, context: CommandContext, mutation: boolean): Promise<boolean>
  recordUnknown(reservation: ProvisioningReservation, context: CommandContext): Promise<boolean>
}

// Binary CPF codec is separate from CSRF and has its own keyring. No plaintext DB field.
export const cpfEnvelopeSchema = z.strictObject({
  codecVersion: z.literal(1),
  algorithm: z.literal("A256GCM"),
  purpose: z.literal("CPF"),
  identityId: opaqueIdSchema,
  generation: positive,
  keyVersion: positive,
  // IV(12) + encrypted canonical CPF(11) + tag(16).
  ciphertext: z.instanceof(Uint8Array).refine((value) => value.byteLength === 39),
})
export type CpfEnvelope = z.infer<typeof cpfEnvelopeSchema>

export interface CpfCrypto {
  sealCpf(cpf: string, identityId: string, generation: number, context: Abortable): Promise<CpfEnvelope>
  openCpf(envelope: CpfEnvelope, identityId: string, generation: number, context: Abortable): Promise<string>
  lookupCpf(cpf: string, keyVersion: number, context: Abortable): Promise<Uint8Array>
}

export interface CpfDatabase {
  readPolicy(context: Abortable): Promise<{ generation: number; activeVersion: number; pendingVersion: number | null }>
  readSource(identityId: string, identityGeneration: number, context: Abortable): Promise<{ revision: number; envelope: CpfEnvelope } | null>
  writeSource(envelope: CpfEnvelope, revision: number, policyGeneration: number,
    lookups: ReadonlyArray<{ keyVersion: number; hash: Uint8Array }>, context: CommandContext): Promise<number>
}
