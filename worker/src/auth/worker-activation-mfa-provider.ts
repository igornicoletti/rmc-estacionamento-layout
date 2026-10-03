import { z } from "zod"
import { authHttpPolicy } from "../../../src/shared/auth/auth-http-contracts"
import { authPolicy } from "../../../src/shared/auth/auth-policy"
import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { httpDeadline, readHttpJson } from "../../../src/lib/http/http-stream"
import { WorkerProblem } from "../http/worker-http"
import { ownedActivationUser, type ActivationProviderClaim } from "./worker-activation-provider"

const factorSchema = z.object({
  id: opaqueIdSchema, factor_type: z.string(), status: z.string(), friendly_name: z.string().optional(),
})
const userSchema = z.object({ id: opaqueIdSchema })
const enrollmentSchema = z.object({
  id: opaqueIdSchema, type: z.literal("totp"),
  totp: z.object({ secret: z.string().regex(/^[A-Z2-7]{16,128}$/),
    uri: z.string().min(20).max(1024) }),
})
const challengeSchema = z.object({ id: opaqueIdSchema })
const verifiedSchema = z.object({ access_token: z.string().min(40).max(4096),
  expires_in: z.number().int().min(300).max(86400) })

export class WorkerActivationMfaProvider {
  constructor(private readonly url: string, private readonly secret: string,
    private readonly transport: typeof fetch = fetch) {
    if (url !== "http://127.0.0.1:55321" || !secret) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
  }
  private async call(path: string, method: "GET" | "POST" | "DELETE", token: string,
    body: unknown, signal: AbortSignal): Promise<unknown> {
    if (token.length < 40 || token.length > 4096
      || !(path === "/auth/v1/user" || path === "/auth/v1/factors"
        || /^\/auth\/v1\/factors\/[0-9a-f-]{36}\/(challenge|verify)$/.test(path)
        || /^\/auth\/v1\/admin\/users\/[0-9a-f-]{36}\/factors(?:\/[0-9a-f-]{36})?$/.test(path))) {
      throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
    }
    const deadline = httpDeadline(signal, authPolicy.upstreamAttemptTimeoutMs)
    try {
      const response = await this.transport(`${this.url}${path}`, {
        method, redirect: "manual", signal: deadline.signal,
        headers: { apikey: this.secret, Authorization: `Bearer ${token}`,
          Accept: "application/json", ...(method === "POST" ? { "Content-Type": "application/json" } : {}) },
        ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
      })
      if (response.status < 200 || response.status >= 300
        || response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
        void response.body?.cancel().catch(() => {})
        throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      }
      return await readHttpJson(response.body, authHttpPolicy.rpcResponseBytes, deadline.signal)
    } catch { throw new WorkerProblem("AUTH_PROVIDER_FAILURE") }
    finally { deadline.dispose() }
  }
  async user(claim: ActivationProviderClaim, token: string, signal: AbortSignal) {
    const value = await this.call("/auth/v1/user", "GET", token, undefined, signal)
    const parsed = userSchema.safeParse(value)
    if (!parsed.success || !ownedActivationUser(value, claim)) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    return parsed.data
  }
  async factors(claim: ActivationProviderClaim, signal: AbortSignal) {
    if (!opaqueIdSchema.safeParse(claim.providerSubject).success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    const value = await this.call(`/auth/v1/admin/users/${claim.providerSubject}/factors`,
      "GET", this.secret, undefined, signal)
    const parsed = z.array(factorSchema).safeParse(value)
    if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    return parsed.data
  }
  async enroll(claim: ActivationProviderClaim, token: string, commandId: string, signal: AbortSignal) {
    if (!opaqueIdSchema.safeParse(commandId).success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
    await this.user(claim, token, signal)
    const before = await this.factors(claim, signal)
    if (before.length !== 0) throw new WorkerProblem("AUTH_STATE_CONFLICT")
    const value = await this.call("/auth/v1/factors", "POST", token,
      { factor_type: "totp", friendly_name: `RMC activation ${commandId}` }, signal)
    const parsed = enrollmentSchema.safeParse(value)
    if (!parsed.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    const uri = new URL(parsed.data.totp.uri)
    if (uri.protocol !== "otpauth:" || uri.host !== "totp"
      || uri.searchParams.get("secret") !== parsed.data.totp.secret) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    return { factorId: parsed.data.id, secret: parsed.data.totp.secret, uri: parsed.data.totp.uri }
  }
  async resetUnverified(claim: ActivationProviderClaim, token: string,
    previousCommand: string, factorId: string | null, signal: AbortSignal) {
    await this.user(claim, token, signal)
    const factors = await this.factors(claim, signal)
    if (factors.length > 1) throw new WorkerProblem("AUTH_STATE_CONFLICT")
    if (factors.length === 1) {
      const factor = factors[0]
      if (factor.factor_type !== "totp" || factor.status !== "unverified"
        || factor.friendly_name !== `RMC activation ${previousCommand}`
        || (factorId !== null && factor.id !== factorId)) throw new WorkerProblem("AUTH_STATE_CONFLICT")
      const deleted = z.object({ id: opaqueIdSchema.optional() }).safeParse(await this.call(
        `/auth/v1/admin/users/${claim.providerSubject}/factors/${factor.id}`,
        "DELETE", this.secret, undefined, signal))
      if (!deleted.success || (deleted.data.id && deleted.data.id !== factor.id))
        throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    }
    if ((await this.factors(claim, signal)).length !== 0) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
  }
  async verify(claim: ActivationProviderClaim, token: string, factorId: string,
    code: string, signal: AbortSignal) {
    if (!opaqueIdSchema.safeParse(factorId).success || !/^\d{6}$/.test(code))
      throw new WorkerProblem("AUTH_INVALID_REQUEST")
    await this.user(claim, token, signal)
    const before = await this.factors(claim, signal)
    if (before.length !== 1 || before[0].id !== factorId
      || before[0].factor_type !== "totp") throw new WorkerProblem("AUTH_STATE_CONFLICT")
    const challenged = challengeSchema.safeParse(await this.call(
      `/auth/v1/factors/${factorId}/challenge`, "POST", token, { factorId }, signal))
    if (!challenged.success) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    const verified = verifiedSchema.safeParse(await this.call(
      `/auth/v1/factors/${factorId}/verify`, "POST", token,
      { challenge_id: challenged.data.id, code }, signal))
    if (!verified.success) throw new WorkerProblem("AUTH_CREDENTIALS_INVALID")
    const accessToken = verified.data.access_token
    let jwt: unknown
    try {
      const parts = accessToken.split(".")
      if (parts.length !== 3) throw new Error()
      const payload = parts[1].replaceAll("-", "+").replaceAll("_", "/")
      jwt = JSON.parse(atob(payload + "=".repeat((4 - payload.length % 4) % 4)))
    }
    catch { throw new WorkerProblem("AUTH_PROVIDER_FAILURE") }
    const claims = z.object({ sub: opaqueIdSchema, aal: z.literal("aal2"),
      exp: z.number().int().positive() }).safeParse(jwt)
    if (!claims.success || claims.data.sub !== claim.providerSubject
      || claims.data.exp * 1000 <= Date.now() + 5 * 60_000) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    await this.user(claim, accessToken, signal)
    const after = await this.factors(claim, signal)
    if (after.length !== 1 || after[0].id !== factorId
      || after[0].factor_type !== "totp" || after[0].status !== "verified") {
      throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
    }
    return { accessToken, expiresAt: new Date(claims.data.exp * 1000).toISOString() }
  }
  async proveNoFactor(claim: ActivationProviderClaim, token: string, signal: AbortSignal) {
    await this.user(claim, token, signal)
    const factors = await this.factors(claim, signal)
    if (factors.length !== 0) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  }
}
