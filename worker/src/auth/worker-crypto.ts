import { z } from "zod"
import type { CryptoProvider, EncryptedEnvelope } from "../../../src/shared/auth/auth-ports"
import { authSecretSchema } from "../../../src/shared/auth/auth-http-contracts"
import { WorkerProblem } from "../http/worker-http"

const keysSchema = z.strictObject({ cookie: authSecretSchema, csrf: authSecretSchema, rate: authSecretSchema })
const ringSchema = z.strictObject({
  currentVersion: z.number().int().positive(),
  versions: z.record(z.string().regex(/^[1-9]\d{0,8}$/), keysSchema),
})
const envelopeSchema = z.strictObject({
  codecVersion: z.literal(1), algorithm: z.literal("A256GCM"),
  purpose: z.literal("CSRF"), binding: z.string().min(1).max(512),
  keyVersion: z.number().int().positive(),
  ciphertext: z.instanceof(Uint8Array).refine((value) => value.length === 60),
})
export function encodeSecret(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}
export function decodeSecret(text: string): Uint8Array {
  if (!authSecretSchema.safeParse(text).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
  return Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/") + "="), (c) => c.charCodeAt(0))
}
export function hex(bytes: Uint8Array): string { return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("") }
export function unhex(text: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/.test(text)) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
  return Uint8Array.from(text.match(/../g) ?? [], (b) => parseInt(b, 16))
}
export function contextBinding(id: string, purpose: string, generation: number): string {
  return JSON.stringify([1, id, purpose, generation])
}
export class WorkerCrypto implements CryptoProvider {
  readonly ring: z.infer<typeof ringSchema>
  constructor(serialized: string) {
    try {
      this.ring = ringSchema.parse(JSON.parse(serialized) as unknown)
      if (!this.ring.versions[this.ring.currentVersion] || Object.keys(this.ring.versions).length > 8) throw new Error()
      // Domain keys must be distinct, including allowed historical versions.
      const values = Object.values(this.ring.versions).flatMap((v) => Object.values(v))
      if (new Set(values).size !== values.length) throw new Error()
    } catch { throw new WorkerProblem("AUTH_CONFIGURATION_ERROR") }
  }
  randomBytes(length: number): Uint8Array {
    if (!Number.isInteger(length) || length < 1 || length > 65536) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
    return crypto.getRandomValues(new Uint8Array(length))
  }
  private key(purpose: string, version: number): Uint8Array {
    const set = this.ring.versions[version]
    if (!set) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
    if (purpose === "COOKIE") return decodeSecret(set.cookie)
    if (purpose === "CSRF") return decodeSecret(set.csrf)
    if (purpose === "RATE") return decodeSecret(set.rate)
    throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
  }
  async hmac(purpose: string, value: Uint8Array, keyVersion: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey("raw", this.key(purpose, keyVersion), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    return new Uint8Array(await crypto.subtle.sign("HMAC", key, value))
  }
  async seal(purpose: string, plaintext: Uint8Array, binding: string, version = this.ring.currentVersion): Promise<EncryptedEnvelope> {
    if (purpose !== "CSRF" || plaintext.length !== 32 || binding.length < 1 || binding.length > 512) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
    const keyVersion = version
    const key = await crypto.subtle.importKey("raw", this.key(purpose, keyVersion), "AES-GCM", false, ["encrypt"])
    const iv = this.randomBytes(12)
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128,
      additionalData: new TextEncoder().encode(JSON.stringify([purpose, binding, keyVersion])),
    }, key, plaintext))
    const ciphertext = new Uint8Array(iv.length + encrypted.length)
    ciphertext.set(iv); ciphertext.set(encrypted, iv.length)
    return { codecVersion: 1, algorithm: "A256GCM", purpose, binding, keyVersion, ciphertext }
  }
  async open(input: unknown): Promise<Uint8Array> {
    const parsed = envelopeSchema.safeParse(input)
    if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    const envelope = parsed.data
    try {
      const key = await crypto.subtle.importKey("raw", this.key(envelope.purpose, envelope.keyVersion), "AES-GCM", false, ["decrypt"])
      return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: envelope.ciphertext.slice(0, 12), tagLength: 128,
      additionalData: new TextEncoder().encode(JSON.stringify([envelope.purpose, envelope.binding, envelope.keyVersion])),
    }, key, envelope.ciphertext.slice(12))) }
    catch { throw new WorkerProblem("AUTH_PROVIDER_FAILURE") }
  }
}
