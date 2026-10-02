import { describe, expect, it, vi } from "vitest"
import type { DeliveryMessage, DeliveryStore, DeliverySmsGateway } from "../../src/shared/auth/auth-delivery"
import { deliveryMessageSchema } from "../../src/shared/auth/auth-delivery"
import { DeliveryCrypto } from "../src/delivery/worker-delivery-crypto"
import { consumeDelivery, dispatchDelivery, reconcileDelivery, receiveDeliveryReceipt } from "../src/delivery/worker-delivery"
import { encodeSecret, decodeSecret } from "../src/auth/worker-crypto"
import { LocalHttpSmsGateway } from "../src/delivery/worker-sms-gateway"

const key = (n: number) => encodeSecret(new Uint8Array(32).fill(n))
const ring = { currentVersion: 1, delivery: { "1": key(111) }, phone: { "1": key(112) }, receipt: { currentVersion: 1, keys: { "1": key(113) } } }
const id = "01000000-0000-4000-8000-000000000001"
async function fixture() {
  const codec = new DeliveryCrypto(ring, [])
  const meta = { outboxId: id, challengeId: "01000000-0000-4000-8000-000000000002", purpose: "ACTIVATION" as const,
    generation: 1, idempotencyKey: "01000000-0000-4000-8000-000000000003" }
  const message: DeliveryMessage = { ...meta, schemaVersion: 1, messageId: id, createdAt: new Date().toISOString(), envelope: await codec.sealDelivery(meta, "12345678") }
  const phone = await codec.sealPhone("+5511999999999", id, 1)
  const store = {
    claimReconciliation: vi.fn<DeliveryStore["claimReconciliation"]>(() => Promise.resolve([])), begin: vi.fn(() => Promise.resolve(true)),
    claim: vi.fn(() => Promise.resolve([{ message, fence: 1 }])), published: vi.fn(() => Promise.resolve(true)),
    admit: vi.fn<DeliveryStore["admit"]>(() => Promise.resolve({ kind: "READY" as const, fence: 1, phone })), finish: vi.fn(() => Promise.resolve(true)), receipt: vi.fn(() => Promise.resolve(true)),
    quarantine: vi.fn(() => Promise.resolve(true)),
  }
  const gateway = { readOutcome: vi.fn<DeliverySmsGateway["readOutcome"]>(() => Promise.resolve("UNKNOWN")), send: vi.fn<DeliverySmsGateway["send"]>(() => Promise.resolve("ACCEPTED")) }
  const ack = vi.fn(), retry = vi.fn()
  const batch: MessageBatch<unknown> = { queue: "auth-delivery", metadata: { metrics: { backlogCount: 1, backlogBytes: 0 } }, messages: [{ body: message, id, timestamp: new Date(), attempts: 1, ack, retry }], ackAll: vi.fn(), retryAll: vi.fn() }
  return { codec, message, phone, store, gateway, batch, ack, retry, signal: new AbortController().signal, enabled: true }
}
describe("F05 delivery Workers", () => {
  it("binds OTP/phone to purpose, identity, generation and allows retained keys only", async () => {
    const f = await fixture()
    expect(await f.codec.openDelivery(f.message)).toBe("12345678")
    expect(await f.codec.openDelivery({ ...f.message, envelope: { ...f.message.envelope,
      ciphertext: "AQIDBAUGBwgJCgsMnPvRoaRLDLpMl-FawxYv4M5GDUmZ7kARImsCwiBuLABv_g" } })).toBe("12345678")
    expect(await f.codec.openPhone(f.phone)).toBe("+5511999999999")
    expect(await f.codec.openPhone({ ...f.phone, ciphertext: "AQIDBAUGBwgJCgsMIVZNSd43uSb6yl3JwgqUpQV825YTaNPPLNbY1s_a" })).toBe("+5511999999999")
    await expect(f.codec.openDelivery({ ...f.message, generation: 2 })).rejects.toThrow()
    await expect(f.codec.openDelivery({ ...f.message, envelope: { ...f.message.envelope,
      ciphertext: (f.message.envelope.ciphertext.startsWith("A") ? "B" : "A") + f.message.envelope.ciphertext.slice(1) } })).rejects.toThrow()
    await expect(f.codec.openPhone({ ...f.phone, generation: 2 })).rejects.toThrow()
    await expect(f.codec.openDelivery({ ...f.message, envelope: { ...f.message.envelope, keyVersion: 3 } })).rejects.toThrow()
    const rotated = new DeliveryCrypto({ currentVersion: 2, delivery: { ...ring.delivery, "2": key(114) }, phone: { ...ring.phone, "2": key(115) }, receipt: ring.receipt }, [])
    expect(await rotated.openDelivery(f.message)).toBe("12345678")
    expect((await rotated.sealDelivery(f.message, "87654321")).keyVersion).toBe(2)
    expect(() => new DeliveryCrypto(ring, [ring.receipt.keys["1"]])).toThrow()
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    const canonical = ring.receipt.keys["1"]
    const alternative = canonical.slice(0, -1) + alphabet[alphabet.indexOf(canonical.at(-1)!) + 1]
    expect(encodeSecret(Uint8Array.from(atob(alternative.replaceAll("-", "+").replaceAll("_", "/") + "="), (c) => c.charCodeAt(0)))).toBe(canonical)
    expect(() => decodeSecret(alternative)).toThrow()
    expect(() => new DeliveryCrypto({ ...ring, receipt: { currentVersion: 1, keys: { "1": alternative } } }, [])).toThrow()
    expect(() => new DeliveryCrypto(ring, [alternative])).toThrow()
    expect(deliveryMessageSchema.safeParse({ ...f.message, phone: "+5511999999999" }).success).toBe(false)
    expect(JSON.stringify(f.message)).not.toContain("12345678")
  })
  it("publishes stable IDs and persists send failure through CAS", async () => {
    const f = await fixture(), send = vi.fn(() => Promise.resolve({ metadata: { metrics: { backlogCount: 1, backlogBytes: 0 } } }))
    await dispatchDelivery(f.store, { send }, f.signal)
    expect(send).toHaveBeenCalledWith(f.message)
    send.mockRejectedValueOnce(new Error())
    await dispatchDelivery(f.store, { send }, f.signal)
    expect(f.store.published).toHaveBeenLastCalledWith(f.message, expect.any(String), 1, false, f.signal)
  })
  it("persists outcome before ack, deduplicates terminal redelivery", async () => {
    const f = await fixture()
    await consumeDelivery(f.batch, { ...f, crypto: f.codec })
    expect(f.gateway.send).toHaveBeenCalledWith({ idempotencyKey: f.message.idempotencyKey, phoneE164: "+5511999999999", body: "Código RMC: 12345678" }, f.signal)
    expect(f.store.finish).toHaveBeenCalledWith(f.message, expect.any(String), 1, "ACCEPTED", f.signal)
    expect(f.ack).toHaveBeenCalledOnce()
    vi.mocked(f.store.admit).mockResolvedValue({ kind: "DONE" })
    await consumeDelivery(f.batch, { ...f, crypto: f.codec })
    expect(f.gateway.send).toHaveBeenCalledOnce()
  })
  it("never resends unknown/crashed REQUESTED; consults gateway then retries durably", async () => {
    const f = await fixture()
    vi.mocked(f.store.admit).mockResolvedValue({ kind: "UNKNOWN", fence: 2 })
    await consumeDelivery(f.batch, { ...f, crypto: f.codec })
    expect(f.gateway.send).not.toHaveBeenCalled(); expect(f.ack).not.toHaveBeenCalled(); expect(f.retry).toHaveBeenCalledOnce()
    vi.mocked(f.gateway.readOutcome).mockResolvedValue("ACCEPTED")
    await consumeDelivery(f.batch, { ...f, crypto: f.codec })
    expect(f.gateway.send).not.toHaveBeenCalled(); expect(f.ack).toHaveBeenCalledOnce()
  })
  it("stale/decoy ack only after durable admission; DB outage, kill switch, poison and CAS loss retry", async () => {
    const f = await fixture()
    vi.mocked(f.store.admit).mockResolvedValue({ kind: "STALE" })
    await consumeDelivery(f.batch, { ...f, crypto: f.codec })
    expect(f.ack).toHaveBeenCalledOnce(); expect(f.gateway.send).not.toHaveBeenCalled()
    vi.mocked(f.store.admit).mockRejectedValue(new Error())
    await consumeDelivery(f.batch, { ...f, crypto: f.codec })
    await consumeDelivery(f.batch, { ...f, enabled: false, crypto: f.codec })
    const poison = { ...f.batch, messages: [{ ...f.batch.messages[0], body: { schemaVersion: 9 } }] }
    await consumeDelivery(poison, { ...f, crypto: f.codec })
    expect(f.retry).toHaveBeenCalledTimes(3)
  })
  it("DLQ consults gateway and durably defers unknown without outbound", async () => {
    const f = await fixture()
    await consumeDelivery(f.batch, { ...f, crypto: f.codec, dlq: true })
    expect(f.store.finish).toHaveBeenCalledWith(f.message, expect.any(String), 1, "RECONCILIATION_REQUIRED", f.signal)
    expect(f.gateway.send).not.toHaveBeenCalled(); expect(f.ack).toHaveBeenCalledOnce()
  })
  it("DLQ poison and disabled items require durable quarantine before ack", async () => {
    const f = await fixture()
    const poison = { ...f.batch, queue: "auth-delivery-dlq", messages: [{ ...f.batch.messages[0], body: { schemaVersion: 99 } }] }
    await consumeDelivery(poison, { ...f, crypto: f.codec, dlq: true })
    expect(f.store.quarantine).toHaveBeenCalledWith(id, "auth-delivery-dlq", "MALFORMED", f.signal)
    expect(f.ack).toHaveBeenCalledOnce()
    f.store.quarantine.mockResolvedValue(false)
    await consumeDelivery(poison, { ...f, enabled: false, crypto: f.codec, dlq: true })
    expect(f.retry).toHaveBeenCalledOnce(); expect(f.ack).toHaveBeenCalledOnce()
    expect(f.gateway.send).not.toHaveBeenCalled()
  })
  it("authenticates bounded receipts and denies changed bytes/timestamp", async () => {
    const f = await fixture()
    const receipt = { schemaVersion: 1, receiptId: id, messageId: id, idempotencyKey: f.message.idempotencyKey,
      outcome: "DELIVERED", timestamp: new Date().toISOString() }
    const bytes = new TextEncoder().encode(JSON.stringify(receipt))
    const cryptoKey = await crypto.subtle.importKey("raw", decodeSecret(ring.receipt.keys["1"]), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    const signature = encodeSecret(new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, bytes)))
    const rotated = new DeliveryCrypto({ ...ring, receipt: { currentVersion: 2, keys: { ...ring.receipt.keys, "2": key(116) } } }, [])
    expect(await receiveDeliveryReceipt(bytes, signature, rotated, f.store, f.signal, "1")).toBe(true)
    expect(await receiveDeliveryReceipt(bytes, signature, rotated, f.store, f.signal, "2")).toBe(false)
    expect(await receiveDeliveryReceipt(bytes, signature, rotated, f.store, f.signal, "99")).toBe(false)
    expect(await receiveDeliveryReceipt(bytes, signature, rotated, f.store, f.signal, "")).toBe(false)
    expect(await receiveDeliveryReceipt(bytes, signature, f.codec, f.store, f.signal, "1")).toBe(true)
    bytes[1] ^= 1
    expect(await receiveDeliveryReceipt(bytes, signature, f.codec, f.store, f.signal, "1")).toBe(false)
    expect(f.store.receipt).toHaveBeenCalledTimes(2)
  })
  it("recovers a preparation failure without recording an external request", async () => {
    const f = await fixture(), decrypt = vi.spyOn(f.codec, "openDelivery")
    decrypt.mockRejectedValueOnce(new Error("Synthetic decrypt failure"))
    await consumeDelivery(f.batch, { ...f, crypto: f.codec })
    expect(f.store.begin).not.toHaveBeenCalled()
    expect(f.gateway.send).not.toHaveBeenCalled()
    expect(f.store.finish).not.toHaveBeenCalled()
    await consumeDelivery(f.batch, { ...f, crypto: f.codec })
    expect(f.store.begin).toHaveBeenCalledOnce()
    expect(f.gateway.send).toHaveBeenCalledOnce()
  })
  it("denies outbound when fresh begin loses its fence or current authorization", async () => {
    const f = await fixture()
    f.store.begin.mockResolvedValue(false)
    await consumeDelivery(f.batch, { ...f, crypto: f.codec })
    expect(f.gateway.send).not.toHaveBeenCalled()
    expect(f.ack).not.toHaveBeenCalled()
    expect(f.retry).toHaveBeenCalledOnce()
  })
  it("reconciles accepted DLQ outcome without decrypt or outbound; CAS loss cannot ack", async () => {
    const f = await fixture(), decrypt = vi.spyOn(f.codec, "openDelivery")
    f.gateway.readOutcome.mockResolvedValue("ACCEPTED")
    f.store.finish.mockResolvedValueOnce(false)
    await consumeDelivery(f.batch, { ...f, crypto: f.codec, dlq: true })
    expect(f.ack).not.toHaveBeenCalled()
    await consumeDelivery(f.batch, { ...f, crypto: f.codec, dlq: true })
    expect(f.store.finish).toHaveBeenLastCalledWith(f.message, expect.any(String), 1, "ACCEPTED", f.signal)
    expect(f.ack).toHaveBeenCalledOnce()
    expect(decrypt).not.toHaveBeenCalled()
    expect(f.gateway.send).not.toHaveBeenCalled()
  })
  it("scheduled reconciliation records unknown/known outcomes without access to plaintext", async () => {
    const f = await fixture()
    f.store.claimReconciliation.mockResolvedValue([{ message: f.message, fence: 9 }])
    expect(await reconcileDelivery(f.store, f.gateway, f.signal)).toEqual({ attempted: 1, resolved: 0 })
    f.gateway.readOutcome.mockResolvedValue("DELIVERED")
    expect(await reconcileDelivery(f.store, f.gateway, f.signal)).toEqual({ attempted: 1, resolved: 1 })
    expect(f.gateway.send).not.toHaveBeenCalled()
    expect(f.store.begin).not.toHaveBeenCalled()
  })
  it("bounds a hung Queue wait and rejects a lost publish CAS", async () => {
    const f = await fixture(), ac = new AbortController()
    const send = vi.fn<Queue["send"]>(() => new Promise(() => {}))
    const run = dispatchDelivery(f.store, { send }, ac.signal)
    // Allow claim/send to begin, then cancel the parent budget.
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce())
    ac.abort(new Error("Synthetic deadline"))
    await expect(run).rejects.toThrow("Synthetic deadline")
    expect(f.store.published).not.toHaveBeenCalled()
    f.store.published.mockResolvedValue(false)
    await expect(dispatchDelivery(f.store, { send: () => Promise.resolve({ metadata: { metrics: { backlogCount: 0, backlogBytes: 0 } } }) }, f.signal)).rejects.toThrow("claim lost")
  })
  it("expires its own Queue deadline even when the parent remains active", async () => {
    const f = await fixture()
    await dispatchDelivery(f.store, { send: () => new Promise(() => {}) }, f.signal)
    expect(f.signal.aborted).toBe(false)
    expect(f.store.published).toHaveBeenCalledWith(f.message, expect.any(String), 1, false, f.signal)
  })
  it("HTTP gateway rejects redirect, malformed/oversized and preserves unknown outcome", async () => {
    const gateway = new LocalHttpSmsGateway("http://127.0.0.1:5791", "x".repeat(32))
    const fetchMock = vi.spyOn(globalThis, "fetch")
    const signal = new AbortController().signal
    try {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: "https://example.invalid" } }))
      expect(await gateway.readOutcome(id, signal)).toBe("UNKNOWN")
      expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:5791/outcome", expect.objectContaining({ redirect: "manual" }))
      fetchMock.mockResolvedValueOnce(Response.json({ outcome: "DELIVERED", unknown: true }))
      expect(await gateway.readOutcome(id, signal)).toBe("UNKNOWN")
      fetchMock.mockResolvedValueOnce(new Response("x".repeat(1025), { headers: { "Content-Type": "application/json" } }))
      expect(await gateway.readOutcome(id, signal)).toBe("UNKNOWN")
      fetchMock.mockResolvedValueOnce(Response.json({ outcome: "ACCEPTED" }))
      expect(await gateway.readOutcome(id, signal)).toBe("ACCEPTED")
    } finally { fetchMock.mockRestore() }
    expect(() => new LocalHttpSmsGateway("https://example.invalid", "x".repeat(32))).toThrow()
  })
})
