import { z } from "zod"
import type { DeliverySmsGateway, SmsOutcome } from "../../../src/shared/auth/auth-delivery"
import { httpDeadline, readHttpBytes } from "../../../src/lib/http/http-stream"

const responseSchema = z.strictObject({ outcome: z.enum(["ACCEPTED", "DELIVERED", "REJECTED", "UNKNOWN"]) })
// Explicit local protocol; target provider contract/configuration is still gated.
export class LocalHttpSmsGateway implements DeliverySmsGateway {
  constructor(private readonly url: string, private readonly token: string) {
    if (url !== "http://127.0.0.1:5791" || token.length < 32) throw new Error("SMS target not admitted")
  }
  async #request(path: string, body: unknown, parent: AbortSignal): Promise<SmsOutcome> {
    const deadline = httpDeadline(parent, 3000)
    try {
      const response = await fetch(this.url + path, { method: "POST", redirect: "manual", signal: deadline.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.token}` }, body: JSON.stringify(body) })
      if (response.status !== 200 || response.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
        await response.body?.cancel(); return "UNKNOWN"
      }
      return responseSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
        await readHttpBytes(response.body, 1024, deadline.signal))) as unknown).outcome
    } catch { return "UNKNOWN" } finally { deadline.dispose() }
  }
  send(input: { idempotencyKey: string; phoneE164: string; body: string }, signal: AbortSignal) {
    z.strictObject({ idempotencyKey: z.uuid(), phoneE164: z.string().regex(/^\+[1-9]\d{1,14}$/), body: z.string().max(160) }).parse(input)
    return this.#request("/send", input, signal)
  }
  readOutcome(idempotencyKey: string, signal: AbortSignal) { return this.#request("/outcome", { idempotencyKey: z.uuid().parse(idempotencyKey) }, signal) }
}
