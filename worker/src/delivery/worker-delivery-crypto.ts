import { z } from "zod"
import { deliveryBinding, deliveryEnvelopeSchema, deliveryPayloadSchema, phoneEnvelopeSchema } from "../../../src/shared/auth/auth-delivery"
import type { DeliveryEnvelope, DeliveryMessage, PhoneEnvelope } from "../../../src/shared/auth/auth-delivery"
import { authSecretSchema } from "../../../src/shared/auth/auth-http-contracts"
import { decodeSecret, encodeSecret } from "../auth/worker-crypto"

const keys = z.record(z.string().regex(/^[1-9]\d{0,8}$/), authSecretSchema)
const ringSchema = z.strictObject({ currentVersion: z.number().int().positive().max(999999999), delivery: keys, phone: keys, receipt: z.strictObject({ currentVersion: z.number().int().positive().max(999999999), keys }) })
const aad = (purpose: "delivery" | "phone", binding: string, version: number) => new TextEncoder().encode(
  purpose === "phone" ? JSON.stringify([1, "A256GCM", ...JSON.parse(binding) as unknown[], version])
    : JSON.stringify([1, "A256GCM", purpose, binding, version]))
function decode(value: string): Uint8Array {
  const bytes = Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0))
  if (encodeSecret(bytes) !== value) throw new Error("Noncanonical ciphertext")
  return bytes
}
export class DeliveryCrypto {
  readonly #ring: z.infer<typeof ringSchema>
  constructor(input: unknown, forbiddenKeys: readonly string[]) {
    this.#ring = ringSchema.parse(input)
    const values = [...Object.values(this.#ring.delivery), ...Object.values(this.#ring.phone), ...Object.values(this.#ring.receipt.keys)]
    // Compare canonical encodings of actual key bytes, not alternate Base64 padding bits.
    const canonicalForbidden = forbiddenKeys.map((value) => encodeSecret(decodeSecret(value)))
    if (!this.#ring.delivery[this.#ring.currentVersion] || !this.#ring.phone[this.#ring.currentVersion]
      || !this.#ring.receipt.keys[this.#ring.receipt.currentVersion] || Object.keys(this.#ring.receipt.keys).length > 8
      || Object.keys(this.#ring.delivery).length > 8 || Object.keys(this.#ring.phone).length > 8
      || new Set(values).size !== values.length
      || values.some((v) => encodeSecret(decodeSecret(v)) !== v || canonicalForbidden.includes(v))) throw new Error("Invalid delivery keyring")
  }
  async #seal(purpose: "delivery" | "phone", plaintext: string, binding: string): Promise<string> {
    const version = this.#ring.currentVersion
    const key = await crypto.subtle.importKey("raw", decodeSecret(this.#ring[purpose][version]), "AES-GCM", false, ["encrypt"])
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128,
      additionalData: aad(purpose, binding, version) }, key, new TextEncoder().encode(plaintext)))
    const bytes = new Uint8Array(12 + ciphertext.length); bytes.set(iv); bytes.set(ciphertext, 12)
    return encodeSecret(bytes)
  }
  async #open(purpose: "delivery" | "phone", ciphertext: string, binding: string, version: number): Promise<string> {
    const material = this.#ring[purpose][version]
    if (!material) throw new Error("Unknown key version")
    const key = await crypto.subtle.importKey("raw", decodeSecret(material), "AES-GCM", false, ["decrypt"])
    const bytes = decode(ciphertext)
    const plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12), tagLength: 128,
      additionalData: aad(purpose, binding, version) }, key, bytes.slice(12)))
    try { return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(plaintext) } finally { plaintext.fill(0) }
  }
  async sealDelivery(m: Parameters<typeof deliveryBinding>[0], otp: string): Promise<DeliveryEnvelope> {
    const binding = deliveryBinding(m)
    return { codecVersion: 1, algorithm: "A256GCM", purpose: "SMS_DELIVERY", keyVersion: this.#ring.currentVersion,
      binding, ciphertext: await this.#seal("delivery", JSON.stringify(deliveryPayloadSchema.parse({ otp })), binding) }
  }
  async openDelivery(m: DeliveryMessage): Promise<string> {
    const e = deliveryEnvelopeSchema.parse(m.envelope)
    if (e.binding !== deliveryBinding(m)) throw new Error("Delivery binding mismatch")
    return deliveryPayloadSchema.parse(JSON.parse(await this.#open("delivery", e.ciphertext, e.binding, e.keyVersion)) as unknown).otp
  }
  async sealPhone(phone: string, identityId: string, generation: number): Promise<PhoneEnvelope> {
    z.string().regex(/^\+[1-9]\d{1,14}$/).parse(phone)
    const candidate = phoneEnvelopeSchema.omit({ ciphertext: true }).parse({ identityId, generation, keyVersion: this.#ring.currentVersion })
    return { ...candidate, ciphertext: await this.#seal("phone", phone, JSON.stringify(["PHONE", identityId, generation])) }
  }
  async openPhone(input: PhoneEnvelope): Promise<string> {
    const p = phoneEnvelopeSchema.parse(input)
    return z.string().regex(/^\+[1-9]\d{1,14}$/).parse(await this.#open("phone", p.ciphertext, JSON.stringify(["PHONE", p.identityId, p.generation]), p.keyVersion))
  }
  async verifyReceipt(bytes: Uint8Array, signature: string, version: string): Promise<boolean> {
    if (!/^[1-9]\d{0,8}$/.test(version) || !this.#ring.receipt.keys[version] || !authSecretSchema.safeParse(signature).success) return false
    if (encodeSecret(decodeSecret(signature)) !== signature) return false
    const key = await crypto.subtle.importKey("raw", decodeSecret(this.#ring.receipt.keys[version]), { name: "HMAC", hash: "SHA-256" }, false, ["verify"])
    return crypto.subtle.verify("HMAC", key, decodeSecret(signature), bytes)
  }
}
