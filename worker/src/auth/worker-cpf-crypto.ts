import { z } from "zod"
import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { cpfSchema } from "../../../src/shared/auth/auth-identity-contracts"
import { authSecretSchema } from "../../../src/shared/auth/auth-http-contracts"
import { cpfEnvelopeSchema } from "../../../src/shared/auth/auth-provisioning"
import type { CpfCrypto, CpfEnvelope } from "../../../src/shared/auth/auth-provisioning"
import type { Abortable } from "../../../src/shared/auth/auth-ports"
import { WorkerProblem } from "../http/worker-http"
import { decodeSecret } from "./worker-crypto"

const version = z.number().int().positive().max(999999999)
const keys = z.record(z.string().regex(/^[1-9]\d{0,8}$/), authSecretSchema)
const ringSchema = z.strictObject({ currentSourceVersion: version, source: keys, lookup: keys })
const aad = (identityId: string, generation: number, keyVersion: number) =>
  new TextEncoder().encode(JSON.stringify([1, "A256GCM", "CPF", identityId, generation, keyVersion]))

// Not wired to Env or a route. F04 must inject a purpose-separated keyring server-side.
export class WorkerCpfCrypto implements CpfCrypto {
  readonly #ring: z.infer<typeof ringSchema>
  constructor(input: unknown, forbiddenKeys: readonly string[]) {
    const parsed = ringSchema.safeParse(input)
    if (!parsed.success) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
    const values = [...Object.values(parsed.data.source), ...Object.values(parsed.data.lookup)]
    if (!parsed.data.source[parsed.data.currentSourceVersion] || Object.keys(parsed.data.source).length > 8
      || Object.keys(parsed.data.lookup).length < 1 || Object.keys(parsed.data.lookup).length > 8
      || new Set(values).size !== values.length || values.some((key) => forbiddenKeys.includes(key))) {
      throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
    }
    this.#ring = parsed.data
  }
  #check(context: Abortable, identityId?: string, generation?: number) {
    if (context.signal.aborted) throw new WorkerProblem("AUTH_DEPENDENCY_UNAVAILABLE")
    if (identityId !== undefined && (!opaqueIdSchema.safeParse(identityId).success
      || !z.number().int().positive().max(Number.MAX_SAFE_INTEGER).safeParse(generation).success)) {
      throw new WorkerProblem("AUTH_INVALID_REQUEST")
    }
  }
  async sealCpf(input: string, identityId: string, generation: number, context: Abortable): Promise<CpfEnvelope> {
    this.#check(context, identityId, generation)
    const parsed = cpfSchema.safeParse(input)
    if (!parsed.success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
    const keyVersion = this.#ring.currentSourceVersion
    const key = await crypto.subtle.importKey("raw", decodeSecret(this.#ring.source[keyVersion]), "AES-GCM", false, ["encrypt"])
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128,
      additionalData: aad(identityId, generation, keyVersion) }, key, new TextEncoder().encode(parsed.data)))
    this.#check(context)
    const ciphertext = new Uint8Array(39)
    ciphertext.set(iv); ciphertext.set(encrypted, 12)
    return { codecVersion: 1, algorithm: "A256GCM", purpose: "CPF", identityId, generation, keyVersion, ciphertext }
  }
  async openCpf(input: CpfEnvelope, identityId: string, generation: number, context: Abortable): Promise<string> {
    this.#check(context, identityId, generation)
    const parsed = cpfEnvelopeSchema.safeParse(input)
    if (!parsed.success || parsed.data.identityId !== identityId || parsed.data.generation !== generation) {
      throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    }
    const envelope = parsed.data
    try {
      const serializedKey = this.#ring.source[envelope.keyVersion]
      if (!serializedKey) throw new Error()
      const key = await crypto.subtle.importKey("raw", decodeSecret(serializedKey), "AES-GCM", false, ["decrypt"])
      const bytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv: envelope.ciphertext.slice(0, 12), tagLength: 128,
        additionalData: aad(identityId, generation, envelope.keyVersion) }, key, envelope.ciphertext.slice(12))
      this.#check(context)
      return cpfSchema.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes))
    } catch { throw new WorkerProblem("AUTH_PROVIDER_FAILURE") }
  }
  async lookupCpf(input: string, keyVersion: number, context: Abortable): Promise<Uint8Array> {
    this.#check(context)
    const cpf = cpfSchema.safeParse(input)
    const serializedKey = this.#ring.lookup[keyVersion]
    if (!cpf.success || !version.safeParse(keyVersion).success || !serializedKey) throw new WorkerProblem("AUTH_INVALID_REQUEST")
    const key = await crypto.subtle.importKey("raw", decodeSecret(serializedKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    const hash = new Uint8Array(await crypto.subtle.sign("HMAC", key,
      new TextEncoder().encode(JSON.stringify(["CPF_LOOKUP", keyVersion, cpf.data]))))
    this.#check(context)
    return hash
  }
}
