import { z } from "zod"
import { deliveryMessageSchema, phoneEnvelopeSchema } from "../../../src/shared/auth/auth-delivery"
import type { DeliveryStore } from "../../../src/shared/auth/auth-delivery"
import { createWorkerRpc } from "../http/worker-rpc"

const fence = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const claimSchema = z.array(z.strictObject({ message: deliveryMessageSchema, fence })).max(10)
const admissionSchema = z.union([
  z.strictObject({ kind: z.literal("READY"), fence, phone: phoneEnvelopeSchema }),
  z.strictObject({ kind: z.literal("UNKNOWN"), fence }),
  z.strictObject({ kind: z.enum(["STALE", "DONE", "RETRY"]) }),
])
export function createDeliveryStore(url: string, secret: string): DeliveryStore {
  const rpc = createWorkerRpc(url, secret, ["claim_delivery", "claim_delivery_reconciliation", "begin_delivery", "finish_delivery_publish", "admit_delivery", "finish_delivery", "apply_delivery_receipt", "quarantine_delivery"])
  return {
    async claim(owner, signal) { return claimSchema.parse(await rpc("claim_delivery", { p_owner: owner }, signal)) },
    async claimReconciliation(owner, signal) { return claimSchema.parse(await rpc("claim_delivery_reconciliation", { p_owner: owner }, signal)) },
    async published(m, owner, token, success, signal) {
      return z.boolean().parse(await rpc("finish_delivery_publish", { p_id: m.outboxId, p_owner: owner, p_fence: token, p_success: success }, signal))
    },
    async admit(m, owner, signal) { return admissionSchema.parse(await rpc("admit_delivery", { p_id: m.outboxId, p_owner: owner, p_message: m }, signal)) },
    async begin(m, owner, token, phone, signal) {
      return z.boolean().parse(await rpc("begin_delivery", { p_id: m.outboxId, p_owner: owner, p_fence: token, p_message: m, p_phone: phone }, signal))
    },
    async finish(m, owner, token, outcome, signal) {
      return z.boolean().parse(await rpc("finish_delivery", { p_id: m.outboxId, p_owner: owner, p_fence: token, p_outcome: outcome }, signal))
    },
    async receipt(r, signal) {
      return z.boolean().parse(await rpc("apply_delivery_receipt", { p_receipt: r.receiptId, p_id: r.messageId,
        p_key: r.idempotencyKey, p_outcome: r.outcome, p_timestamp: r.timestamp }, signal))
    },
    async quarantine(messageId, queue, reason, signal, body) {
      return z.boolean().parse(await rpc("quarantine_delivery", { p_message: messageId, p_queue: queue, p_reason: reason, p_body: deliveryMessageSchema.safeParse(body).success ? body : null }, signal))
    },
  }
}
