import { z } from "zod"
import { authSecretSchema } from "../../../src/shared/auth/auth-http-contracts"
import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { WorkerProblem } from "../http/worker-http"
import { decodeSecret, hex, unhex } from "./worker-crypto"

const ringSchema = z.strictObject({
  currentVersion: z.number().int().positive(),
  keys: z.record(z.string().regex(/^[1-9]\d{0,8}$/), authSecretSchema),
})
const bindingSchema = z.strictObject({
  identityId: opaqueIdSchema, sessionId: opaqueIdSchema,
  generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
})
type Binding = z.infer<typeof bindingSchema>

export class WorkerProviderEnvelope {
  readonly #ring: z.infer<typeof ringSchema>
  constructor(serialized: string, forbiddenKeys: readonly string[]) {
    try {
      const ring = ringSchema.parse(JSON.parse(serialized) as unknown)
      const keys = Object.values(ring.keys)
      if (!ring.keys[ring.currentVersion] || keys.length > 8
        || new Set([...keys, ...forbiddenKeys]).size !== keys.length + forbiddenKeys.length) throw new Error()
      this.#ring = ring
    } catch { throw new WorkerProblem("AUTH_CONFIGURATION_ERROR") }
  }
  async seal(accessToken: string, binding: Binding): Promise<{ ciphertext: string; keyVersion: number }> {
    if (!bindingSchema.safeParse(binding).success || accessToken.length < 40 || accessToken.length > 4096)
      throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    const keyVersion = this.#ring.currentVersion
    const key = await crypto.subtle.importKey("raw", decodeSecret(this.#ring.keys[keyVersion]), "AES-GCM", false, ["encrypt"])
    const nonce = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(accessToken)
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce,
      additionalData: new TextEncoder().encode(JSON.stringify(["ACTIVATION_PROVIDER", 1, binding, keyVersion])),
    }, key, encoded))
    const ciphertext = new Uint8Array(nonce.length + encrypted.length)
    ciphertext.set(nonce); ciphertext.set(encrypted, nonce.length)
    if (ciphertext.length > 8192) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    return { ciphertext: hex(ciphertext), keyVersion }
  }
  async open(ciphertextHex: string, keyVersion: number, binding: Binding): Promise<string> {
    if (!bindingSchema.safeParse(binding).success || !this.#ring.keys[keyVersion])
      throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    const ciphertext = unhex(ciphertextHex)
    if (ciphertext.length < 68 || ciphertext.length > 8192) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    try {
      const key = await crypto.subtle.importKey("raw", decodeSecret(this.#ring.keys[keyVersion]), "AES-GCM", false, ["decrypt"])
      const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ciphertext.slice(0, 12),
        additionalData: new TextEncoder().encode(JSON.stringify(["ACTIVATION_PROVIDER", 1, binding, keyVersion])),
      }, key, ciphertext.slice(12))
      return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(plaintext)
    } catch { throw new WorkerProblem("AUTH_PROVIDER_FAILURE") }
  }
}
