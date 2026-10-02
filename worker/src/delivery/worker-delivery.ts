import { deliveryMessageSchema, deliveryReceiptEndpoint } from "../../../src/shared/auth/auth-delivery"
import type { DeliverySmsGateway, DeliveryStore } from "../../../src/shared/auth/auth-delivery"
import type { DeliveryCrypto } from "./worker-delivery-crypto"
import { httpDeadline } from "../../../src/lib/http/http-stream"

// Bound waiting, not the external side effect: a late Queue success remains ambiguous.
async function boundedQueueSend(queue: Pick<Queue, "send">, message: Parameters<Queue["send"]>[0], parent: AbortSignal) {
  const deadline = httpDeadline(parent, 3000)
  let onAbort: () => void = () => {}
  try {
    deadline.signal.throwIfAborted()
    await Promise.race([queue.send(message), new Promise<never>((_, reject) => {
      onAbort = () => {
        const reason: unknown = deadline.signal.reason
        reject(reason instanceof Error ? reason : new Error("Delivery Queue deadline"))
      }
      deadline.signal.addEventListener("abort", onAbort, { once: true })
      if (deadline.signal.aborted) onAbort()
    })])
  } finally { deadline.signal.removeEventListener("abort", onAbort); deadline.dispose() }
}

export async function dispatchDelivery(store: DeliveryStore, queue: Pick<Queue, "send">, signal: AbortSignal) {
  const owner = crypto.randomUUID()
  const claimed = await store.claim(owner, signal)
  for (const item of claimed) {
    signal.throwIfAborted()
    let success = false
    try { await boundedQueueSend(queue, deliveryMessageSchema.parse(item.message), signal); success = true } catch { /* Unknown publication recovers with the same IDs. */ }
    signal.throwIfAborted()
    if (!await store.published(item.message, owner, item.fence, success, signal)) throw new Error("Delivery publish claim lost")
  }
  return claimed.length
}
export async function reconcileDelivery(store: DeliveryStore, gateway: DeliverySmsGateway, signal: AbortSignal) {
  const owner = crypto.randomUUID()
  const claimed = await store.claimReconciliation(owner, signal)
  let resolved = 0
  for (const item of claimed) {
    signal.throwIfAborted()
    const outcome = await gateway.readOutcome(item.message.idempotencyKey, signal)
    if (await store.finish(item.message, owner, item.fence, outcome, signal) && outcome !== "UNKNOWN") resolved++
  }
  console.log(JSON.stringify({ operation: "delivery-reconciliation", attempted: claimed.length, resolved, unresolved: claimed.length - resolved }))
  return { attempted: claimed.length, resolved }
}
export async function consumeDelivery(batch: MessageBatch<unknown>, deps: {
  enabled: boolean; store: DeliveryStore; crypto: DeliveryCrypto; gateway: DeliverySmsGateway; signal: AbortSignal; dlq?: boolean
}) {
  for (const item of batch.messages) {
    const retry = () => {
      const delaySeconds = Math.min(300, 2 ** Math.min(item.attempts, 8)) + crypto.getRandomValues(new Uint8Array(1))[0] % 7
      console.log(JSON.stringify({ operation: "delivery-consume", outcome: "RETRY", delaySeconds, dlq: deps.dlq === true }))
      item.retry({ delaySeconds })
    }
    try {
      if (!deps.enabled) {
        if (deps.dlq && await deps.store.quarantine(item.id, batch.queue, "DISABLED", deps.signal, item.body)) item.ack()
        else retry()
        continue
      }
      const parsed = deliveryMessageSchema.safeParse(item.body)
      // Poison reaches DLQ; durable redacted evidence is required before terminal ack.
      if (!parsed.success) {
        if (deps.dlq && await deps.store.quarantine(item.id, batch.queue, "MALFORMED", deps.signal)) item.ack()
        else retry()
        continue
      }
      const message = parsed.data
      const owner = crypto.randomUUID()
      const admission = await deps.store.admit(message, owner, deps.signal)
      if (admission.kind === "DONE" || admission.kind === "STALE") {
        console.log(JSON.stringify({ operation: "delivery-consume", outcome: admission.kind }))
        item.ack(); continue
      }
      if (!("fence" in admission)) { retry(); continue }
      let outcome = await deps.gateway.readOutcome(message.idempotencyKey, deps.signal)
      if (outcome === "UNKNOWN" && admission.kind === "READY" && !deps.dlq) {
        const otp = await deps.crypto.openDelivery(message)
        const phoneE164 = await deps.crypto.openPhone(admission.phone)
        deps.signal.throwIfAborted()
        // Prepare is recoverable. Only this fenced, freshly revalidated claim authorizes outbound.
        if (!await deps.store.begin(message, owner, admission.fence, admission.phone, deps.signal)) { retry(); continue }
        deps.signal.throwIfAborted()
        try { outcome = await deps.gateway.send({ idempotencyKey: message.idempotencyKey, phoneE164, body: `Código RMC: ${otp}` }, deps.signal) }
        catch { outcome = "UNKNOWN" }
      }
      const persisted = await deps.store.finish(message, owner, admission.fence,
        deps.dlq && outcome === "UNKNOWN" ? "RECONCILIATION_REQUIRED" : outcome, deps.signal)
      console.log(JSON.stringify({ operation: "delivery-consume", outcome, persisted }))
      if (persisted && (outcome !== "UNKNOWN" || deps.dlq)) item.ack()
      else retry()
    } catch { retry() }
  }
}
export async function receiveDeliveryReceipt(bytes: Uint8Array, signature: string, codec: DeliveryCrypto, store: DeliveryStore, signal: AbortSignal, keyVersion: string) {
  if (bytes.length > deliveryReceiptEndpoint.maxBytes || !await codec.verifyReceipt(bytes, signature, keyVersion)) return false
  let body: unknown
  try { body = JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes)) as unknown }
  catch { return false }
  const parsed = deliveryReceiptEndpoint.request.safeParse(body)
  if (!parsed.success || Math.abs(Date.now() - Date.parse(parsed.data.timestamp)) > 300_000) return false
  return store.receipt(parsed.data, signal)
}
