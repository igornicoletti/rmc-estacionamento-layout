import { z } from "zod"
import { opaqueIdSchema } from "./auth-contracts"

const id = opaqueIdSchema
const generation = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
export const deliveryEnvelopeSchema = z.strictObject({
  codecVersion: z.literal(1), algorithm: z.literal("A256GCM"),
  keyVersion: generation, purpose: z.literal("SMS_DELIVERY"),
  binding: z.string().min(1).max(1024),
  ciphertext: z.string().min(40).max(2048).regex(/^[A-Za-z0-9_-]+$/),
})
export const deliveryMessageSchema = z.strictObject({
  schemaVersion: z.literal(1), messageId: id, idempotencyKey: id, outboxId: id,
  challengeId: id, purpose: z.enum(["ACTIVATION", "RECOVERY"]), generation,
  envelope: deliveryEnvelopeSchema, createdAt: z.iso.datetime({ offset: true }),
}).refine((m) => m.messageId === m.outboxId)
export type DeliveryMessage = z.infer<typeof deliveryMessageSchema>
export type DeliveryEnvelope = z.infer<typeof deliveryEnvelopeSchema>
export const deliveryPayloadSchema = z.strictObject({ otp: z.string().regex(/^\d{8}$/) })
export const phoneEnvelopeSchema = z.strictObject({
  identityId: id, generation, keyVersion: generation,
  ciphertext: z.string().min(40).max(64).regex(/^[A-Za-z0-9_-]+$/),
})
export type PhoneEnvelope = z.infer<typeof phoneEnvelopeSchema>
export type SmsOutcome = "ACCEPTED" | "DELIVERED" | "REJECTED" | "UNKNOWN"
export interface DeliverySmsGateway {
  send(input: { idempotencyKey: string; phoneE164: string; body: string }, signal: AbortSignal): Promise<SmsOutcome>
  readOutcome(idempotencyKey: string, signal: AbortSignal): Promise<SmsOutcome>
}
export const deliveryReceiptSchema = z.strictObject({
  schemaVersion: z.literal(1), receiptId: id, messageId: id, idempotencyKey: id,
  outcome: z.enum(["DELIVERED", "REJECTED"]), timestamp: z.iso.datetime({ offset: true }),
})
export type DeliveryReceipt = z.infer<typeof deliveryReceiptSchema>
export const deliveryReceiptEndpoint = {
  path: "/api/internal/delivery/receipt", method: "POST", mediaType: "application/json", maxBytes: 4096,
  request: deliveryReceiptSchema,
} as const
export function deliveryBinding(m: Pick<DeliveryMessage, "outboxId" | "challengeId" | "purpose" | "generation" | "idempotencyKey">): string {
  return JSON.stringify([1, "SMS_DELIVERY", m.outboxId, m.challengeId, m.purpose, m.generation, m.idempotencyKey])
}
export interface DeliveryStore {
  claim(owner: string, signal: AbortSignal): Promise<{ message: DeliveryMessage; fence: number }[]>
  claimReconciliation(owner: string, signal: AbortSignal): Promise<{ message: DeliveryMessage; fence: number }[]>
  published(message: DeliveryMessage, owner: string, fence: number, success: boolean, signal: AbortSignal): Promise<boolean>
  admit(message: DeliveryMessage, owner: string, signal: AbortSignal): Promise<
    | { kind: "READY"; fence: number; phone: PhoneEnvelope }
    | { kind: "UNKNOWN"; fence: number }
    | { kind: "STALE" | "DONE" | "RETRY" }>
  begin(message: DeliveryMessage, owner: string, fence: number, phone: PhoneEnvelope, signal: AbortSignal): Promise<boolean>
  finish(message: DeliveryMessage, owner: string, fence: number, outcome: SmsOutcome | "RECONCILIATION_REQUIRED", signal: AbortSignal): Promise<boolean>
  receipt(receipt: DeliveryReceipt, signal: AbortSignal): Promise<boolean>
  quarantine(messageId: string, queue: string, reason: "MALFORMED" | "DISABLED", signal: AbortSignal, body?: unknown): Promise<boolean>
}
