import { z } from "zod"
import { authSecretSchema } from "../../../src/shared/auth/auth-http-contracts"
import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { authPolicy } from "../../../src/shared/auth/auth-policy"
import { decodeSecret, encodeSecret } from "./worker-crypto"
import { WorkerProblem } from "../http/worker-http"

const keyVersion = z.number().int().positive().max(999999999)
const ringSchema = z.strictObject({
  currentVersion: keyVersion,
  keys: z.record(z.string().regex(/^[1-9]\d{0,8}$/), authSecretSchema),
})
const bindingSchema = z.strictObject({
  journeyId: opaqueIdSchema,
  challengeId: opaqueIdSchema,
  identityId: opaqueIdSchema.nullable(),
  generation: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  expiresAt: z.iso.datetime({ offset: true }),
})
export type OtpBinding = z.infer<typeof bindingSchema>

export class WorkerOtp {
  readonly #ring: z.infer<typeof ringSchema>
  constructor(input: unknown, forbiddenKeys: readonly string[]) {
    const parsed = ringSchema.safeParse(input)
    if (!parsed.success || !parsed.data.keys[parsed.data.currentVersion]
      || Object.keys(parsed.data.keys).length > 8
      || new Set([...Object.values(parsed.data.keys), ...forbiddenKeys]).size
        !== Object.values(parsed.data.keys).length + forbiddenKeys.length) {
      throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
    }
    this.#ring = parsed.data
  }

  generate(): string {
    let code = ""
    while (code.length < authPolicy.otpDigits) {
      for (const byte of crypto.getRandomValues(new Uint8Array(32))) {
        if (byte < 250) code += String(byte % 10)
        if (code.length === authPolicy.otpDigits) break
      }
    }
    return code
  }

  async verifier(code: string, binding: OtpBinding, version = this.#ring.currentVersion): Promise<{ keyVersion: number; hash: Uint8Array }> {
    if (!new RegExp(`^\\d{${authPolicy.otpDigits}}$`).test(code) || !bindingSchema.safeParse(binding).success
      || !this.#ring.keys[version]) throw new WorkerProblem("AUTH_INVALID_REQUEST")
    const key = await crypto.subtle.importKey("raw", decodeSecret(this.#ring.keys[version]),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    const value = new TextEncoder().encode(JSON.stringify([
      "RMC_ACTIVATION_OTP", 1, version, binding.journeyId, binding.challengeId,
      binding.identityId, binding.generation, binding.expiresAt, code,
    ]))
    return { keyVersion: version, hash: new Uint8Array(await crypto.subtle.sign("HMAC", key, value)) }
  }

  get currentVersion(): number { return this.#ring.currentVersion }
}

export function parseOtpKeyring(serialized: string, forbiddenKeys: readonly string[]): WorkerOtp {
  try { return new WorkerOtp(JSON.parse(serialized) as unknown, forbiddenKeys.map((key) => encodeSecret(decodeSecret(key)))) }
  catch { throw new WorkerProblem("AUTH_CONFIGURATION_ERROR") }
}
