import { activationAcceptedSchema, activationBootstrapSchema, activationCancelResponseSchema,
  activationCancelSchema, activationCompleteResponseSchema, activationCompleteSchema,
  activationPasswordSchema, activationRequestSchema, activationResendSchema, activationJourneySchema,
  activationSecuritySetupSchema, activationTotpEnrollSchema, activationTotpSecretSchema,
  activationTotpVerifySchema, activationTotpRestartSchema, activationTotpResumeSchema,
  activationVerifySchema } from "../../../src/shared/auth/auth-activation"
import { AUTH_CONTRACT_VERSION } from "../../../src/shared/auth/auth-contracts"
import { cpfSchema } from "../../../src/shared/auth/auth-identity-contracts"
import { authSecretSchema } from "../../../src/shared/auth/auth-http-contracts"
import { authPolicy } from "../../../src/shared/auth/auth-policy"
import { validateAndNormalizePassword } from "../../../src/shared/auth/auth-password-policy"
import { DeliveryCrypto } from "../delivery/worker-delivery-crypto"
import { jsonResponse, requestJson, WorkerProblem, protectOrigin } from "../http/worker-http"
import { WorkerCpfCrypto } from "./worker-cpf-crypto"
import { createContextStore } from "./worker-context-store"
import { preauthCookie, protectMutation } from "./worker-context"
import { WorkerCrypto, contextBinding, decodeSecret, encodeSecret, hex } from "./worker-crypto"
import { createActivationStore } from "./worker-activation-store"
import { parseOtpKeyring } from "./worker-otp"
import { screenNewPassword } from "./worker-password-screen"
import { WorkerProviderEnvelope } from "./worker-provider-envelope"
import { WorkerActivationProvider } from "./worker-activation-provider"
import { WorkerActivationMfaProvider } from "./worker-activation-mfa-provider"

function collectKeys(value: unknown): string[] {
  if (typeof value === "string") return authSecretSchema.safeParse(value).success ? [value] : []
  if (value && typeof value === "object") return Object.values(value).flatMap(collectKeys)
  return []
}
function decodeBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
  const bytes = Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")
    + "=".repeat((4 - value.length % 4) % 4)), (character) => character.charCodeAt(0))
  if (encodeSecret(bytes) !== value) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
  return bytes
}
async function sha256(value: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))))
}
function activationCookie(request: Request): string {
  const header = request.headers.get("Cookie") ?? ""
  if (new TextEncoder().encode(header).length > authPolicy.cookieHeadersBytes) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const seen = new Map<string, string>()
  for (const part of header.split(";")) {
    const separator = part.indexOf("=")
    const name = part.slice(0, separator < 0 ? undefined : separator).trim()
    if (!["__Host-rmc-preauth", "__Host-rmc-journey", "__Host-rmc-session"].includes(name)) continue
    const value = separator < 0 ? "" : part.slice(separator + 1).trim()
    if (seen.has(name) || !authSecretSchema.safeParse(value).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
    seen.set(name, value)
  }
  if (seen.size !== 1 || !seen.has("__Host-rmc-journey")) throw new WorkerProblem("AUTH_CSRF_INVALID")
  return seen.get("__Host-rmc-journey")!
}
function activationRuntime(env: Env) {
  if (env.BFF_ACTIVATION_ENABLED !== "true" || env.BFF_CONTEXT_ENABLED !== "true"
    || env.BFF_DELIVERY_ENABLED !== "true" || env.ENVIRONMENT !== "LOCAL_PRODUCTION_LIKE"
    || env.AUTH_STAGE !== "disabled" || env.CANONICAL_ORIGIN !== "https://localhost:8787"
    || env.SUPABASE_URL !== "http://127.0.0.1:55321") throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
  try {
    const context = new WorkerCrypto(env.AUTH_KEYRING)
    const contextKeys = collectKeys(context.ring)
    const deliveryRing: unknown = JSON.parse(env.DELIVERY_KEYRING)
    const cpfRing: unknown = JSON.parse(env.CPF_KEYRING)
    const delivery = new DeliveryCrypto(deliveryRing, contextKeys)
    const cpf = new WorkerCpfCrypto(cpfRing, [...contextKeys, ...collectKeys(deliveryRing)])
    const otp = parseOtpKeyring(env.OTP_KEYRING, [...contextKeys, ...collectKeys(deliveryRing), ...collectKeys(cpfRing)])
    const providerEnvelope = new WorkerProviderEnvelope(env.PROVIDER_KEYRING,
      [...contextKeys, ...collectKeys(deliveryRing), ...collectKeys(cpfRing), ...collectKeys(JSON.parse(env.OTP_KEYRING))])
    return { context, cpf, delivery, otp, providerEnvelope,
      provider: new WorkerActivationProvider(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY),
      mfaProvider: new WorkerActivationMfaProvider(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY),
      contexts: createContextStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY),
      store: createActivationStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY) }
  } catch { throw new WorkerProblem("AUTH_CONFIGURATION_ERROR") }
}

async function readSecurity(request: Request, runtime: ReturnType<typeof activationRuntime>, signal: AbortSignal) {
  const cookie = activationCookie(request)
  const csrf = request.headers.get("X-RMC-CSRF-Token")
  if (!csrf || !authSecretSchema.safeParse(csrf).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
  for (const version of Object.keys(runtime.context.ring.versions).map(Number)) {
    const cookieHash = hex(await runtime.context.hmac("COOKIE", decodeSecret(cookie), version))
    const csrfHash = hex(await runtime.context.hmac("CSRF", decodeSecret(csrf), version))
    const setup = await runtime.store.readSecuritySetup(cookieHash, csrfHash, signal)
    if (setup) return { cookie, csrf, cookieHash, csrfHash, setup }
  }
  throw new WorkerProblem("AUTH_CSRF_INVALID")
}

export async function enrollActivationTotp(request: Request, env: Env, requestId: string,
  signal: AbortSignal): Promise<Response> {
  const runtime = activationRuntime(env)
  protectOrigin(request, env.CANONICAL_ORIGIN, true)
  const input = activationTotpEnrollSchema.safeParse(await requestJson(request, signal))
  if (!input.success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const { cookieHash, csrfHash, setup } = await readSecurity(request, runtime, signal)
  if (setup.factorState !== null && setup.factorState !== "CLAIMED")
    throw new WorkerProblem("AUTH_STATE_CONFLICT")
  const owner = crypto.randomUUID()
  const claim = await runtime.store.claimTotp({ cookieHash, csrfHash,
    commandId: input.data.commandId, owner }, signal)
  if (!claim) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  if ("busy" in claim) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  if (claim.identityId !== setup.identityId || claim.sessionId !== setup.sessionId
    || claim.generation !== setup.generation) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  const token = await runtime.providerEnvelope.open(setup.ciphertext, setup.keyVersion, {
    identityId: setup.identityId, sessionId: setup.sessionId, generation: setup.generation,
  })
  const enrolled = await runtime.mfaProvider.enroll(setup, token, input.data.commandId, signal)
  if (!await runtime.store.recordTotp({ identityId: setup.identityId, sessionId: setup.sessionId,
    commandId: input.data.commandId, owner, fence: claim.fence,
    factorId: enrolled.factorId, requestId }, signal)) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  signal.throwIfAborted()
  return jsonResponse(activationTotpSecretSchema.parse({ contractVersion: AUTH_CONTRACT_VERSION,
    factorId: enrolled.factorId, secret: enrolled.secret, uri: enrolled.uri }), requestId)
}

export async function restartActivationTotp(request: Request, env: Env, requestId: string,
  signal: AbortSignal): Promise<Response> {
  const runtime = activationRuntime(env)
  protectOrigin(request, env.CANONICAL_ORIGIN, true)
  const input = activationTotpRestartSchema.safeParse(await requestJson(request, signal))
  if (!input.success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const password = validateAndNormalizePassword(input.data.password)
  if (!password.valid) throw new WorkerProblem("AUTH_CREDENTIALS_INVALID")
  const { cookieHash, csrfHash, setup } = await readSecurity(request, runtime, signal)
  if (!setup.factorState || setup.factorState === "VERIFIED") throw new WorkerProblem("AUTH_STATE_CONFLICT")
  // Reauthenticate without writing a password or applying the creation blocklist.
  const proof = await runtime.provider.provePassword(setup, password.normalized, signal, false)
  const owner = crypto.randomUUID()
  const claim = await runtime.store.claimTotpRecovery({ cookieHash, csrfHash,
    commandId: input.data.commandId, owner }, signal)
  if (!claim || "busy" in claim) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  if (claim.identityId !== setup.identityId || claim.sessionId !== setup.sessionId
    || claim.generation !== setup.generation) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  await runtime.mfaProvider.resetUnverified(setup, proof.accessToken,
    claim.previousCommand, claim.factorId, signal)
  if (!await runtime.store.finishTotpRecovery({ identityId: setup.identityId,
    sessionId: setup.sessionId, commandId: input.data.commandId,
    owner, fence: claim.fence }, signal)) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  signal.throwIfAborted()
  return jsonResponse(activationSecuritySetupSchema.parse({ contractVersion: AUTH_CONTRACT_VERSION,
    step: "SECURITY_SETUP" }), requestId)
}

export async function cancelActivation(request: Request, env: Env, requestId: string,
  signal: AbortSignal): Promise<Response> {
  const runtime = activationRuntime(env)
  protectOrigin(request, env.CANONICAL_ORIGIN, true)
  const input = activationCancelSchema.safeParse(await requestJson(request, signal))
  if (!input.success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const cookie = activationCookie(request)
  const csrf = request.headers.get("X-RMC-CSRF-Token")
  if (!csrf || !authSecretSchema.safeParse(csrf).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
  let cancelled = false
  for (const version of Object.keys(runtime.context.ring.versions).map(Number)) {
    const cookieHash = hex(await runtime.context.hmac("COOKIE", decodeSecret(cookie), version))
    const csrfHash = hex(await runtime.context.hmac("CSRF", decodeSecret(csrf), version))
    if (await runtime.store.cancel(cookieHash, csrfHash, requestId, signal)) {
      cancelled = true; break
    }
  }
  if (!cancelled) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  signal.throwIfAborted()
  return jsonResponse(activationCancelResponseSchema.parse({ contractVersion: AUTH_CONTRACT_VERSION,
    step: "RESTART_REQUIRED" }), requestId,
  "__Host-rmc-journey=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0")
}

async function completionIntent(cookie: string, commandId: string,
  mode: "TOTP" | "SKIP", code: string | null) {
  const key = await crypto.subtle.importKey("raw", decodeSecret(cookie),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const message = new TextEncoder().encode(JSON.stringify(["ACTIVATION_COMPLETE", 1, commandId, mode, code]))
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC", key, message)))
}

async function completionSecrets(runtime: ReturnType<typeof activationRuntime>, cookie: string,
  commandId: string, version: number) {
  const normal = await runtime.context.hmac("COOKIE", new TextEncoder().encode(
    JSON.stringify(["ACTIVATION_NORMAL_SECRET", cookie, commandId])), version)
  const csrf = await runtime.context.hmac("CSRF", new TextEncoder().encode(
    JSON.stringify(["ACTIVATION_NORMAL_CSRF", cookie, commandId])), version)
  return { normal, csrf }
}

function completionResponse(result: { expiresAt: string; idleExpiresAt: string;
  role: string; contextVersion: number },
  secrets: { normal: Uint8Array; csrf: Uint8Array }, requestId: string): Response {
  const maxAge = Math.max(0, Math.floor((Math.min(Date.parse(result.expiresAt),
    Date.parse(result.idleExpiresAt)) - Date.now()) / 1000))
  if (maxAge === 0) throw new WorkerProblem("AUTH_DEPENDENCY_UNAVAILABLE")
  return jsonResponse(activationCompleteResponseSchema.parse({ contractVersion: AUTH_CONTRACT_VERSION,
    step: "COMPLETE", role: result.role, contextVersion: result.contextVersion,
    expiresAt: result.expiresAt, csrfToken: encodeSecret(secrets.csrf) }), requestId, [
    `__Host-rmc-session=${encodeSecret(secrets.normal)}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
    "__Host-rmc-journey=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
  ])
}

export async function completeActivation(request: Request, env: Env, requestId: string,
  signal: AbortSignal, mode: "TOTP" | "SKIP" | "TOTP_REAUTH"): Promise<Response> {
  const runtime = activationRuntime(env)
  protectOrigin(request, env.CANONICAL_ORIGIN, true)
  const body = await requestJson(request, signal)
  const input = mode === "TOTP" ? activationTotpVerifySchema.safeParse(body)
    : mode === "TOTP_REAUTH" ? activationTotpResumeSchema.safeParse(body)
      : activationCompleteSchema.safeParse(body)
  if (!input.success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const cookie = activationCookie(request)
  const csrfToken = request.headers.get("X-RMC-CSRF-Token")
  if (!csrfToken || !authSecretSchema.safeParse(csrfToken).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
  const submittedCode = "code" in input.data && typeof input.data.code === "string" ? input.data.code : null
  const intentHash = await completionIntent(cookie, input.data.commandId,
    mode === "SKIP" ? "SKIP" : "TOTP", submittedCode)
  for (const version of Object.keys(runtime.context.ring.versions).map(Number)) {
    const result = await runtime.store.replayCompletion({ commandId: input.data.commandId,
      cookieHash: hex(await runtime.context.hmac("COOKIE", decodeSecret(cookie), version)),
      csrfHash: hex(await runtime.context.hmac("CSRF", decodeSecret(csrfToken), version)),
      intentHash }, signal)
    if (result) {
      const secrets = await completionSecrets(runtime, cookie, input.data.commandId, result.contextKeyVersion)
      return completionResponse(result, secrets, requestId)
    }
  }
  const { cookieHash, csrfHash, setup } = await readSecurity(request, runtime, signal)
  if (mode === "SKIP" && (setup.role !== "O" || setup.factorId !== null))
    throw new WorkerProblem("AUTH_STATE_CONFLICT")
  if (mode !== "SKIP" && (setup.factorState !== "ENROLLED" || !setup.factorId))
    throw new WorkerProblem("AUTH_STATE_CONFLICT")
  let token = await runtime.providerEnvelope.open(setup.ciphertext, setup.keyVersion, {
    identityId: setup.identityId, sessionId: setup.sessionId, generation: setup.generation,
  })
  if (mode === "TOTP_REAUTH") {
    const password = validateAndNormalizePassword((input.data as { password: string }).password)
    if (!password.valid) throw new WorkerProblem("AUTH_CREDENTIALS_INVALID")
    token = (await runtime.provider.provePassword(setup, password.normalized, signal, false)).accessToken
  }
  let proof: { accessToken: string; expiresAt: string }
  if (mode !== "SKIP") {
    proof = await runtime.mfaProvider.verify(setup, token, setup.factorId!, submittedCode ?? "", signal)
  } else {
    await runtime.mfaProvider.proveNoFactor(setup, token, signal)
    proof = { accessToken: token, expiresAt: setup.providerExpiresAt }
  }
  const contextVersion = runtime.context.ring.currentVersion
  const secrets = await completionSecrets(runtime, cookie, input.data.commandId, contextVersion)
  const binding = contextBinding(input.data.commandId, "NORMAL", 1)
  const sealedCsrf = await runtime.context.seal("CSRF", secrets.csrf, binding, contextVersion)
  const encryptedToken = await runtime.providerEnvelope.seal(proof.accessToken, {
    identityId: setup.identityId, sessionId: setup.sessionId, generation: setup.generation,
  })
  const result = await runtime.store.complete({
    cookieHash, csrfHash, commandId: input.data.commandId, intentHash,
    providerSubject: setup.providerSubject, factorId: mode !== "SKIP" ? setup.factorId : null,
    assurance: mode !== "SKIP" ? "aal2" : "aal1",
    providerCiphertext: encryptedToken.ciphertext, providerKeyVersion: encryptedToken.keyVersion,
    providerExpiresAt: proof.expiresAt, normalSessionId: input.data.commandId,
    normalCookieHash: hex(await runtime.context.hmac("COOKIE", secrets.normal, contextVersion)),
    normalCsrfHash: hex(await runtime.context.hmac("CSRF", secrets.csrf, contextVersion)),
    normalCsrfCiphertext: hex(sealedCsrf.ciphertext), normalBindingHash: await sha256(binding),
    contextKeyVersion: contextVersion, requestId,
  }, signal)
  if (!result) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  signal.throwIfAborted()
  return completionResponse(result, secrets, requestId)
}

async function passwordIntent(cookie: string, normalizedPassword: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", decodeSecret(cookie),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const data = new TextEncoder().encode(JSON.stringify(["ACTIVATION_PASSWORD_INTENT", 1, normalizedPassword]))
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC", key, data)))
}

export async function writeActivationPassword(request: Request, env: Env, requestId: string,
  signal: AbortSignal): Promise<Response> {
  const runtime = activationRuntime(env)
  protectOrigin(request, env.CANONICAL_ORIGIN, true)
  const input = activationPasswordSchema.safeParse(await requestJson(request, signal))
  if (!input.success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const cookie = activationCookie(request)
  const csrfToken = request.headers.get("X-RMC-CSRF-Token")
  if (!csrfToken || !authSecretSchema.safeParse(csrfToken).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
  const password = validateAndNormalizePassword(input.data.password)
  if (!password.valid) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const screening = await screenNewPassword(password.normalized, signal)
  if (screening === "UNAVAILABLE") throw new WorkerProblem("AUTH_DEPENDENCY_UNAVAILABLE")
  if (screening === "BLOCKED") throw new WorkerProblem("AUTH_CREDENTIALS_INVALID")
  const owner = crypto.randomUUID()
  const intentHash = await passwordIntent(cookie, password.normalized)
  let claim: Awaited<ReturnType<ReturnType<typeof createActivationStore>["claimPassword"]>> = null
  for (const version of Object.keys(runtime.context.ring.versions).map(Number)) {
    claim = await runtime.store.claimPassword({
      cookieHash: hex(await runtime.context.hmac("COOKIE", decodeSecret(cookie), version)),
      csrfHash: hex(await runtime.context.hmac("CSRF", decodeSecret(csrfToken), version)),
      commandId: input.data.commandId, intentHash, owner,
    }, signal)
    if (claim) break
  }
  if (!claim) throw new WorkerProblem("AUTH_CSRF_INVALID")
  if ("busy" in claim) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  if ("proved" in claim) return jsonResponse(activationSecuritySetupSchema.parse({
    contractVersion: AUTH_CONTRACT_VERSION, step: "SECURITY_SETUP",
  }), requestId)
  const proof = await runtime.provider.provePassword(claim, password.normalized, signal)
  const envelope = await runtime.providerEnvelope.seal(proof.accessToken, {
    identityId: claim.identityId, sessionId: claim.sessionId, generation: claim.generation,
  })
  if (!await runtime.store.provePassword({
    identityId: claim.identityId, sessionId: claim.sessionId, commandId: input.data.commandId,
    owner, fence: claim.fence, providerSubject: claim.providerSubject,
    ciphertext: envelope.ciphertext, keyVersion: envelope.keyVersion,
    accessExpiresAt: proof.expiresAt, requestId,
  }, signal)) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  signal.throwIfAborted()
  return jsonResponse(activationSecuritySetupSchema.parse({ contractVersion: AUTH_CONTRACT_VERSION,
    step: "SECURITY_SETUP" }), requestId)
}

function activationAcceptedResponse(challengeId: string, expiresAt: string, journeyExpiresAt: string, csrfToken: Uint8Array,
  journeySecret: Uint8Array, requestId: string): Response {
  const remaining = Math.max(0, Math.floor((Date.parse(journeyExpiresAt) - Date.now()) / 1000))
  if (remaining === 0) throw new WorkerProblem("AUTH_DEPENDENCY_UNAVAILABLE")
  return jsonResponse(activationAcceptedSchema.parse({ contractVersion: AUTH_CONTRACT_VERSION,
    challengeId, expiresAt, csrfToken: encodeSecret(csrfToken) }), requestId, [
    `__Host-rmc-journey=${encodeSecret(journeySecret)}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=${remaining}`,
    "__Host-rmc-preauth=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
  ], 202)
}

async function readPendingJourney(runtime: ReturnType<typeof activationRuntime>, cookie: string,
  csrf: string, signal: AbortSignal) {
  for (const version of Object.keys(runtime.context.ring.versions).map(Number)) {
    const cookieHash = hex(await runtime.context.hmac("COOKIE", decodeSecret(cookie), version))
    const csrfHash = hex(await runtime.context.hmac("CSRF", decodeSecret(csrf), version))
    const journey = await runtime.store.readJourney(cookieHash, csrfHash, signal)
    if (journey) return { journey, cookieHash, csrfHash }
  }
  return null
}

export async function getActivationJourney(request: Request, env: Env, requestId: string,
  signal: AbortSignal): Promise<Response> {
  const runtime = activationRuntime(env)
  protectOrigin(request, env.CANONICAL_ORIGIN, false)
  const cookie = activationCookie(request)
  const csrf = request.headers.get("X-RMC-CSRF-Token")
  if (!csrf || !authSecretSchema.safeParse(csrf).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
  const pending = await readPendingJourney(runtime, cookie, csrf, signal)
  if (pending) return jsonResponse(activationJourneySchema.parse({
    contractVersion: AUTH_CONTRACT_VERSION, step: "OTP_REQUIRED",
    challengeId: pending.journey.challengeId, expiresAt: pending.journey.expiresAt,
  }), requestId)
  for (const version of Object.keys(runtime.context.ring.versions).map(Number)) {
    const cookieHash = hex(await runtime.context.hmac("COOKIE", decodeSecret(cookie), version))
    const csrfHash = hex(await runtime.context.hmac("CSRF", decodeSecret(csrf), version))
    const status = await runtime.store.bootstrapStatus(cookieHash, csrfHash, signal)
    if (status) return jsonResponse(activationJourneySchema.parse({
      contractVersion: AUTH_CONTRACT_VERSION, step: status.step }), requestId)
  }
  throw new WorkerProblem("AUTH_CSRF_INVALID")
}

export async function resendActivation(request: Request, env: Env, requestId: string,
  signal: AbortSignal): Promise<Response> {
  const runtime = activationRuntime(env)
  protectOrigin(request, env.CANONICAL_ORIGIN, true)
  const input = activationResendSchema.safeParse(await requestJson(request, signal))
  if (!input.success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const cookie = activationCookie(request)
  const csrf = request.headers.get("X-RMC-CSRF-Token")
  if (!csrf || !authSecretSchema.safeParse(csrf).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
  const pending = await readPendingJourney(runtime, cookie, csrf, signal)
  if (!pending) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  const { journey, cookieHash, csrfHash } = pending
  const nextGeneration = journey.generation + 1
  const challengeId = crypto.randomUUID()
  const outboxId = crypto.randomUUID()
  const expiresAt = new Date(Math.min(Date.now() + authPolicy.otpTtlMs - 5000,
    Date.parse(journey.journeyExpiresAt) - 5000)).toISOString()
  if (Date.parse(expiresAt) <= Date.now()) throw new WorkerProblem("AUTH_STATE_CONFLICT")
  const code = runtime.otp.generate()
  const verifier = await runtime.otp.verifier(code, { journeyId: journey.journeyId,
    challengeId, identityId: journey.identityId, generation: nextGeneration, expiresAt })
  const message = { outboxId, challengeId, purpose: "ACTIVATION" as const,
    generation: nextGeneration, idempotencyKey: outboxId }
  const envelope = await runtime.delivery.sealDelivery(message, code)
  const result = await runtime.store.resend({ cookieHash, csrfHash, commandId: input.data.commandId,
    challengeId, verifierHash: hex(verifier.hash), verifierKeyVersion: verifier.keyVersion,
    ciphertext: hex(decodeBytes(envelope.ciphertext)), deliveryKeyVersion: envelope.keyVersion,
    expiresAt, outboxId }, signal)
  if (!result) throw new WorkerProblem("AUTH_RATE_LIMITED")
  signal.throwIfAborted()
  return activationAcceptedResponse(result.challengeId, result.expiresAt,
    result.journeyExpiresAt, decodeSecret(csrf), decodeSecret(cookie), requestId)
}

export async function requestActivation(request: Request, env: Env, requestId: string, signal: AbortSignal): Promise<Response> {
  const runtime = activationRuntime(env)
  protectOrigin(request, env.CANONICAL_ORIGIN, true)
  const input = activationRequestSchema.safeParse(await requestJson(request, signal))
  if (!input.success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const preauthSecret = preauthCookie(request)
  if (!preauthSecret) throw new WorkerProblem("AUTH_CSRF_INVALID")
  const suppliedCsrf = request.headers.get("X-RMC-CSRF-Token")
  if (!suppliedCsrf || !authSecretSchema.safeParse(suppliedCsrf).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
  const commandId = input.data.commandId
  const normalized = input.data.cpf.replace(/[.\-\s]/g, "")
  const validCpf = cpfSchema.safeParse(normalized)
  const principal = validCpf.success ? validCpf.data : input.data.cpf
  const contextBytes = new TextEncoder().encode(JSON.stringify(["ACTIVATION_INTENT", principal]))
  const preauthBytes = decodeSecret(preauthSecret)
  for (const version of Object.keys(runtime.context.ring.versions).map(Number)) {
    const prior = await runtime.store.replay(commandId,
      hex(await runtime.context.hmac("COOKIE", preauthBytes, version)),
      hex(await runtime.context.hmac("CSRF", decodeSecret(suppliedCsrf), version)),
      hex(await runtime.context.hmac("RATE", contextBytes, version)), signal)
    if (prior) {
      if (prior.contextKeyVersion !== version || prior.journeyId !== commandId) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
      const replaySecret = await runtime.context.hmac("COOKIE", new TextEncoder().encode(
        JSON.stringify(["ACTIVATION_JOURNEY_SECRET", preauthSecret, commandId])), version)
      const replayCsrf = await runtime.context.hmac("CSRF", new TextEncoder().encode(
        JSON.stringify(["ACTIVATION_JOURNEY_CSRF", preauthSecret, commandId])), version)
      signal.throwIfAborted()
      const pending = await readPendingJourney(runtime, encodeSecret(replaySecret), encodeSecret(replayCsrf), signal)
      if (!pending || pending.journey.challengeId !== prior.challengeId) throw new WorkerProblem("AUTH_STATE_CONFLICT")
      return activationAcceptedResponse(prior.challengeId, prior.expiresAt,
        pending.journey.journeyExpiresAt, replayCsrf, replaySecret, requestId)
    }
  }
  const context = await protectMutation(request, env.CANONICAL_ORIGIN, runtime.context, runtime.contexts, signal)
  const intentHash = hex(await runtime.context.hmac("RATE", contextBytes, context.keyVersion))
  const ipHash = hex(await runtime.context.hmac("RATE", new TextEncoder().encode("LOCAL_LOOPBACK"), context.keyVersion))
  const versions = runtime.cpf.lookupVersions()
  const lookups = validCpf.success ? await Promise.all(versions.map(async (version) => ({ keyVersion: version,
    hash: hex(await runtime.cpf.lookupCpf(validCpf.data, version, { signal })) })))
    : [{ keyVersion: versions[0], hash: hex(await runtime.context.hmac("RATE",
      new TextEncoder().encode(JSON.stringify(["INVALID_CPF_LOOKUP", input.data.cpf])), context.keyVersion)) }]
  const candidate = await runtime.store.candidate(lookups, signal)
  const journeySecret = await runtime.context.hmac("COOKIE", new TextEncoder().encode(
    JSON.stringify(["ACTIVATION_JOURNEY_SECRET", preauthSecret, commandId])), context.keyVersion)
  const csrfToken = await runtime.context.hmac("CSRF", new TextEncoder().encode(
    JSON.stringify(["ACTIVATION_JOURNEY_CSRF", preauthSecret, commandId])), context.keyVersion)
  const journeyId = commandId
  const binding = contextBinding(journeyId, "PREAUTH", 1)
  const csrfEnvelope = await runtime.context.seal("CSRF", csrfToken, binding, context.keyVersion)
  const challengeId = crypto.randomUUID()
  const outboxId = crypto.randomUUID()
  const challengeExpiresAt = new Date(Date.now() + authPolicy.otpTtlMs - 5000).toISOString()
  const otpCode = runtime.otp.generate()
  const verifier = await runtime.otp.verifier(otpCode, {
    journeyId, challengeId, identityId: candidate?.identityId ?? null,
    generation: 1, expiresAt: challengeExpiresAt,
  })
  const message = { outboxId, challengeId, purpose: "ACTIVATION" as const, generation: 1, idempotencyKey: outboxId }
  const envelope = await runtime.delivery.sealDelivery(message, otpCode)
  const accepted = await runtime.store.begin({
    commandId, preauthId: context.contextId,
    preauthCookieHash: hex(await runtime.context.hmac("COOKIE", preauthBytes, context.keyVersion)),
    preauthCsrfHash: context.csrfHash, intentHash, ipHash, lookups,
    expectedIdentityId: candidate?.identityId ?? null, expectedGeneration: candidate?.generation ?? null,
    journeyId, journeyCookieHash: hex(await runtime.context.hmac("COOKIE", journeySecret, context.keyVersion)),
    bindingHash: await sha256(binding), csrfHash: hex(await runtime.context.hmac("CSRF", csrfToken, context.keyVersion)),
    csrfCiphertext: hex(csrfEnvelope.ciphertext), contextKeyVersion: context.keyVersion,
    challengeId, verifierHash: hex(verifier.hash), verifierKeyVersion: verifier.keyVersion,
    ciphertext: hex(decodeBytes(envelope.ciphertext)), deliveryKeyVersion: envelope.keyVersion,
    challengeExpiresAt, outboxId,
  }, signal)
  if ("limited" in accepted) throw new WorkerProblem("AUTH_RATE_LIMITED")
  signal.throwIfAborted()
  const pending = await readPendingJourney(runtime, encodeSecret(journeySecret), encodeSecret(csrfToken), signal)
  if (!pending || pending.journey.challengeId !== accepted.challengeId) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
  return activationAcceptedResponse(accepted.challengeId, accepted.expiresAt,
    pending.journey.journeyExpiresAt, csrfToken, journeySecret, requestId)
}

export async function verifyActivation(request: Request, env: Env, requestId: string, signal: AbortSignal): Promise<Response> {
  const runtime = activationRuntime(env)
  protectOrigin(request, env.CANONICAL_ORIGIN, true)
  const input = activationVerifySchema.safeParse(await requestJson(request, signal))
  if (!input.success) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  const cookie = activationCookie(request)
  const csrfToken = request.headers.get("X-RMC-CSRF-Token")
  if (!csrfToken || !authSecretSchema.safeParse(csrfToken).success) throw new WorkerProblem("AUTH_CSRF_INVALID")
  const intentKey = await crypto.subtle.importKey("raw", decodeSecret(cookie),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const intentHash = hex(new Uint8Array(await crypto.subtle.sign("HMAC", intentKey,
    new TextEncoder().encode(JSON.stringify(["ACTIVATION_VERIFY", 1, input.data.commandId,
      input.data.challengeId, input.data.code])))))
  async function bootstrapSecrets(version: number) {
    const binding = JSON.stringify(["ACTIVATION_BOOTSTRAP", cookie, input.data.commandId])
    return {
      sessionCookie: await runtime.context.hmac("COOKIE", new TextEncoder().encode(binding), version),
      sessionCsrf: await runtime.context.hmac("CSRF", new TextEncoder().encode(binding), version),
    }
  }
  function bootstrapResponse(secrets: { sessionCookie: Uint8Array; sessionCsrf: Uint8Array },
    expiresAt: string) {
    const remaining = Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000))
    if (remaining === 0) throw new WorkerProblem("AUTH_STATE_CONFLICT")
    return jsonResponse(activationBootstrapSchema.parse({ contractVersion: AUTH_CONTRACT_VERSION,
      step: "PASSWORD_REQUIRED", csrfToken: encodeSecret(secrets.sessionCsrf) }), requestId, [
      `__Host-rmc-journey=${encodeSecret(secrets.sessionCookie)}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=${remaining}`,
    ])
  }
  let challenge: Awaited<ReturnType<ReturnType<typeof createActivationStore>["readChallenge"]>> = null
  let cookieHash = "", csrfHash = ""
  for (const version of Object.keys(runtime.context.ring.versions).map(Number)) {
    const candidateCookie = hex(await runtime.context.hmac("COOKIE", decodeSecret(cookie), version))
    const candidateCsrf = hex(await runtime.context.hmac("CSRF", decodeSecret(csrfToken), version))
    const replay = await runtime.store.replayVerify({ cookieHash: candidateCookie,
      csrfHash: candidateCsrf, commandId: input.data.commandId,
      challengeId: input.data.challengeId, intentHash }, signal)
    if (replay) {
      const secrets = await bootstrapSecrets(replay.contextKeyVersion)
      return bootstrapResponse(secrets, replay.expiresAt)
    }
    const found = await runtime.store.readChallenge(candidateCookie, candidateCsrf, input.data.challengeId, signal)
    if (found) { challenge = found; cookieHash = candidateCookie; csrfHash = candidateCsrf; break }
  }
  if (!challenge) throw new WorkerProblem("AUTH_CREDENTIALS_INVALID")
  const verifier = await runtime.otp.verifier(input.data.code, {
    journeyId: challenge.journeyId, challengeId: challenge.challengeId,
    identityId: challenge.identityId, generation: challenge.generation,
    expiresAt: challenge.expiresAt,
  }, challenge.keyVersion)
  const sessionId = input.data.commandId
  const { sessionCookie, sessionCsrf } = await bootstrapSecrets(runtime.context.ring.currentVersion)
  const sessionBinding = contextBinding(sessionId, "BOOTSTRAP", 1)
  const sealedCsrf = await runtime.context.seal("CSRF", sessionCsrf, sessionBinding)
  const sessionVersion = sealedCsrf.keyVersion
  const result = await runtime.store.verify({
    cookieHash, csrfHash, challengeId: challenge.challengeId, verifierHash: hex(verifier.hash),
    commandId: input.data.commandId, intentHash,
    sessionId, sessionCookieHash: hex(await runtime.context.hmac("COOKIE", sessionCookie, sessionVersion)),
    sessionCsrfHash: hex(await runtime.context.hmac("CSRF", sessionCsrf, sessionVersion)),
    sessionCsrfCiphertext: hex(sealedCsrf.ciphertext), sessionBindingHash: await sha256(sessionBinding),
    contextKeyVersion: sessionVersion, requestId,
  }, signal)
  if (!result) throw new WorkerProblem("AUTH_CREDENTIALS_INVALID")
  signal.throwIfAborted()
  const replay = await runtime.store.replayVerify({ cookieHash, csrfHash,
    commandId: input.data.commandId, challengeId: input.data.challengeId, intentHash }, signal)
  if (!replay) throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
  return bootstrapResponse({ sessionCookie, sessionCsrf }, replay.expiresAt)
}
