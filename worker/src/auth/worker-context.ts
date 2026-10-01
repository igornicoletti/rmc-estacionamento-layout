import type { AuthContextStore, AuthContextResponse, PersistedAuthContext } from "../../../src/shared/auth/auth-http-contracts"
import { authContextResponseSchema, authSecretSchema } from "../../../src/shared/auth/auth-http-contracts"
import { AUTH_CONTRACT_VERSION } from "../../../src/shared/auth/auth-contracts"
import { AUTH_POLICY_VERSION, authPolicy } from "../../../src/shared/auth/auth-policy"
import { WorkerProblem, protectOrigin } from "../http/worker-http"
import { WorkerCrypto, contextBinding, decodeSecret, encodeSecret, hex, unhex } from "./worker-crypto"

const cookieNames = ["__Host-rmc-preauth", "__Host-rmc-journey", "__Host-rmc-session"] as const
export function preauthCookie(request: Request): string | null {
  const header = request.headers.get("Cookie") ?? ""
  if (new TextEncoder().encode(header).length > authPolicy.cookieHeadersBytes) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const cookies = new Map<string, string>()
  for (const part of header.split(";")) {
    const equal = part.indexOf("=")
    const name = (equal === -1 ? part : part.slice(0, equal)).trim()
    if (!cookieNames.some((n) => n === name)) continue
    const value = part.slice(equal + 1).trim()
    if (equal === -1 || cookies.has(name) || !authSecretSchema.safeParse(value).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
    cookies.set(name, value)
  }
  if (cookies.size > 1) throw new WorkerProblem("AUTH_CSRF_INVALID")
  if (cookies.has("__Host-rmc-journey") || cookies.has("__Host-rmc-session")) throw new WorkerProblem("AUTH_DEPENDENCY_UNAVAILABLE")
  return cookies.get("__Host-rmc-preauth") ?? null
}
async function findContext(secret: string, cryptoAdapter: WorkerCrypto, store: AuthContextStore, signal: AbortSignal) {
  for (const version of Object.keys(cryptoAdapter.ring.versions)) {
    const hash = hex(await cryptoAdapter.hmac("COOKIE", decodeSecret(secret), Number(version)))
    const context = await store.read(hash, signal)
    if (context) return context
  }
  throw new WorkerProblem("AUTH_CSRF_INVALID")
}
async function bindingHash(context: PersistedAuthContext): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(
    contextBinding(context.contextId, context.purpose, context.generation))))
}
export async function getAuthContext(request: Request, origin: string, adapter: WorkerCrypto, store: AuthContextStore, signal: AbortSignal): Promise<{ body: AuthContextResponse; cookie?: string }> {
  protectOrigin(request, origin, false)
  const existing = preauthCookie(request)
  let context: PersistedAuthContext
  let cookie: string | undefined
  if (existing) context = await findContext(existing, adapter, store, signal)
  else {
    const contextId = crypto.randomUUID()
    const secret = adapter.randomBytes(32)
    const token = adapter.randomBytes(32)
    const binding = contextBinding(contextId, "PREAUTH", 1)
    const envelope = await adapter.seal("CSRF", token, binding)
    const created = await store.create({ contextId,
      cookieHash: hex(await adapter.hmac("COOKIE", secret, adapter.ring.currentVersion)),
      csrfHash: hex(await adapter.hmac("CSRF", token, adapter.ring.currentVersion)),
      ciphertext: hex(envelope.ciphertext), bindingHash: hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(binding)))),
      keyVersion: envelope.keyVersion,
      // Local production-like listener is loopback-only. Caller IP headers are ignored.
      ipHash: hex(await adapter.hmac("RATE", new TextEncoder().encode("LOCAL_LOOPBACK"), adapter.ring.currentVersion)),
    }, signal)
    if (created === "limited") throw new WorkerProblem("AUTH_RATE_LIMITED")
    context = created
    const remaining = Math.min(authPolicy.journeyTtlMs, Date.parse(context.expiresAt) - Date.parse(context.serverTime))
    if (remaining <= 0) throw new WorkerProblem("AUTH_CSRF_INVALID")
    cookie = `__Host-rmc-preauth=${encodeSecret(secret)}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(remaining / 1000)}`
  }
  if (!crypto.subtle.timingSafeEqual(await bindingHash(context), unhex(context.bindingHash))) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
  const token = await adapter.open({ codecVersion: context.codecVersion, algorithm: context.algorithm,
    purpose: "CSRF", binding: contextBinding(context.contextId, context.purpose, context.generation),
    keyVersion: context.keyVersion, ciphertext: unhex(context.ciphertext) })
  if (!crypto.subtle.timingSafeEqual(await adapter.hmac("CSRF", token, context.keyVersion), unhex(context.csrfHash))) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
  const body = authContextResponseSchema.parse({
    contractVersion: AUTH_CONTRACT_VERSION, policyVersion: AUTH_POLICY_VERSION,
    serverTime: context.serverTime, contextId: context.contextId,
    authority: { purpose: context.purpose, generation: context.generation, expiresAt: context.expiresAt },
    csrfToken: encodeSecret(token),
  })
  return { body, cookie }
}
export async function protectMutation(request: Request, origin: string, adapter: WorkerCrypto, store: AuthContextStore, signal: AbortSignal): Promise<void> {
  protectOrigin(request, origin, true)
  const secret = preauthCookie(request)
  const token = request.headers.get("X-RMC-CSRF-Token")
  if (!secret || !token || !authSecretSchema.safeParse(token).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
  const context = await findContext(secret, adapter, store, signal)
  const hash = await adapter.hmac("CSRF", decodeSecret(token), context.keyVersion)
  if (!crypto.subtle.timingSafeEqual(hash, unhex(context.csrfHash))
    || !await store.validate(context.contextId, context.generation, hex(hash), signal)) throw new WorkerProblem("AUTH_CSRF_INVALID")
}
