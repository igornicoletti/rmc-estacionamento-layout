import { describe, expect, it } from "vitest"
import { env, exports } from "cloudflare:workers"
import worker from "../src/worker-entry"
import { WorkerCrypto, encodeSecret } from "../src/auth/worker-crypto"
import { getAuthContext, preauthCookie } from "../src/auth/worker-context"
import { auxiliaryWorker } from "./fixtures/worker-auxiliary"
import { problemResponse, protectOrigin, requestJson, validatePath, WorkerProblem } from "../src/http/worker-http"
import type { AuthContextStore, PersistedAuthContext } from "../../src/shared/auth/auth-http-contracts"
import { readHttpBytes, httpDeadline } from "../../src/lib/http/http-stream"

const origin = "https://localhost:8787"
function cryptoAdapter() {
  return new WorkerCrypto(JSON.stringify({ currentVersion: 1, versions: { 1: {
    cookie: encodeSecret(crypto.getRandomValues(new Uint8Array(32))),
    csrf: encodeSecret(crypto.getRandomValues(new Uint8Array(32))),
    rate: encodeSecret(crypto.getRandomValues(new Uint8Array(32))),
  } } }))
}
function storeFixture() {
  const contexts = new Map<string, PersistedAuthContext>()
  let valid = true
  const store: AuthContextStore = {
    create(input) {
      const value: PersistedAuthContext = { ...input, purpose: "PREAUTH", generation: 1,
        expiresAt: new Date(Date.now() + 1_800_000).toISOString(), serverTime: new Date().toISOString() }
      contexts.set(input.cookieHash, value)
      return Promise.resolve(value)
    },
    read(hash) { return Promise.resolve(contexts.get(hash) ?? null) },
    validate() { return Promise.resolve(valid) },
  }
  return { store, invalidate: () => { valid = false }, contexts }
}
function requestWithBody(size: number, headers: HeadersInit = { "Content-Type": "application/json" }) {
  let cancelled = false
  const body = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new TextEncoder().encode('"' + "a".repeat(size - 2) + '"')) },
    pull(controller) { if (size <= 8192) controller.close() },
    cancel() { cancelled = true },
  })
  return { request: new Request(`${origin}/api/auth/login`, { method: "POST", body, headers }), cancelled: () => cancelled }
}

describe("F03 runtime boundary", () => {
  it("routes real Worker API 404 independently of HTML Accept and Auth disabled", async () => {
    for (const path of ["/api", "/api/", "/api/unknown", "/api/auth/login", "/api/auth/context", "/api/auth/refresh"]) {
      const response = await exports.default.fetch(`${origin}${path}`, { headers: { Accept: "text/html" } })
      expect(response.status).toBe(404)
      expect(response.headers.get("Content-Type")).toBe("application/problem+json")
      expect(response.headers.get("Cache-Control")).toBe("no-store")
      expect(await response.json()).toMatchObject({ code: "RESOURCE_NOT_FOUND", status: 404 })
    }
  })
  it("liveness is minimal and unsupported method has a canonical problem", async () => {
    expect(await (await exports.default.fetch(`${origin}/api/health`)).json()).toEqual({ status: "ok" })
    const response = await exports.default.fetch(`${origin}/api/health`, { method: "POST" })
    expect(response.status).toBe(400)
  })
  it("cannot enable context in hosted or HTTP environments and sanitizes failures", async () => {
    const response = await worker.fetch(new Request(`${origin}/api/auth/context`), { ...env, BFF_CONTEXT_ENABLED: "true" })
    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject({ code: "AUTH_CONFIGURATION_ERROR" })
    const unexpected = problemResponse(new Error("synthetic-secret SQL SDK stack"), crypto.randomUUID())
    expect(await unexpected.text()).not.toContain("synthetic-secret")
    expect(unexpected.headers.get("X-Content-Type-Options")).toBe("nosniff")
  })
  it("reads 8192 but cancels 8193 actual bytes without Content-Length", async () => {
    expect(await requestJson(requestWithBody(8192).request, new AbortController().signal)).toHaveLength(8190)
    const over = requestWithBody(8193)
    await expect(requestJson(over.request, new AbortController().signal)).rejects.toMatchObject({ code: "AUTH_BODY_TOO_LARGE" })
    expect(over.cancelled()).toBe(true)
  })
  it("rejects unsupported MIME/encoding, malformed JSON and multibyte overflow", async () => {
    await expect(requestJson(requestWithBody(20, { "Content-Type": "text/plain" }).request, new AbortController().signal)).rejects.toMatchObject({ code: "AUTH_UNSUPPORTED_MEDIA_TYPE" })
    await expect(requestJson(requestWithBody(20, { "Content-Type": "application/json", "Content-Encoding": "gzip" }).request, new AbortController().signal)).rejects.toMatchObject({ code: "AUTH_UNSUPPORTED_MEDIA_TYPE" })
    await expect(requestJson(new Request(origin, { method: "POST", body: '"' + "é".repeat(4096) + '"', headers: { "Content-Type": "application/json" } }), new AbortController().signal)).rejects.toMatchObject({ code: "AUTH_BODY_TOO_LARGE" })
    await expect(requestJson(new Request(origin, { method: "POST", body: "nullx", headers: { "Content-Type": "application/json" } }), new AbortController().signal)).rejects.toMatchObject({ code: "AUTH_INVALID_REQUEST" })
  })
  it("deadline cancels a slow stream, cleanup tolerates prior abort", async () => {
    const deadline = httpDeadline(undefined, 10)
    let cancelled = false
    try {
      await expect(readHttpBytes(new ReadableStream({ cancel() { cancelled = true } }), 8192, deadline.signal)).rejects.toBeDefined()
      expect(cancelled).toBe(true)
    } finally { deadline.dispose() }
    await expect(readHttpBytes(null, 10, AbortSignal.abort())).rejects.toBeDefined()
  })
  it("rejects path ambiguity, oversized URL and cookie header", () => {
    for (const path of ["/api/%61uth", "/api//auth", "/api/auth?x=1", "/api/" + "x".repeat(2048)]) expect(() => validatePath(new Request(origin + path))).toThrow(WorkerProblem)
    expect(() => preauthCookie(new Request(origin, { headers: { Cookie: "x=" + "a".repeat(4096) } }))).toThrow(WorkerProblem)
  })
  it("rejects duplicate, malformed and competing cookies; never downgrades NORMAL", () => {
    expect(() => preauthCookie(new Request(origin, { headers: { Cookie: "__Host-rmc-preauth" } }))).toThrow(WorkerProblem)
    const token = encodeSecret(new Uint8Array(32))
    for (const header of [`__Host-rmc-preauth=x`, `__Host-rmc-preauth=${token}; __Host-rmc-preauth=${token}`, `__Host-rmc-preauth=${token}; __Host-rmc-session=${token}`]) {
      expect(() => preauthCookie(new Request(origin, { headers: { Cookie: header } }))).toThrow(WorkerProblem)
    }
    expect(() => preauthCookie(new Request(origin, { headers: { Cookie: `__Host-rmc-session=${token}` } }))).toThrow("AUTH_DEPENDENCY_UNAVAILABLE")
  })
  it("Origin/Fetch Metadata are strict and absent/none never bypass mutation Origin", () => {
    const denied: HeadersInit[] = [{}, { Origin: "null" }, { Origin: "https://other.invalid" }, { Origin: origin, "Sec-Fetch-Site": "same-site" }, { Origin: origin, "Sec-Fetch-Site": "cross-site" }]
    for (const headers of denied) {
      expect(() => protectOrigin(new Request(origin, { headers }), origin, true)).toThrow(WorkerProblem)
    }
    for (const site of [undefined, "none", "same-origin"]) expect(() => protectOrigin(new Request(origin, { headers: { Origin: origin, ...(site ? { "Sec-Fetch-Site": site } : {}) } }), origin, true)).not.toThrow()
  })
  it("re-delivers synchronizer token; mismatch/stale denied before auxiliary effect", async () => {
    const adapter = cryptoAdapter()
    const fixture = storeFixture()
    const first = await getAuthContext(new Request(origin), origin, adapter, fixture.store, new AbortController().signal)
    const cookie = first.cookie!.split(";")[0]
    expect(first.cookie).toContain("Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=")
    const second = await getAuthContext(new Request(origin, { headers: { Cookie: cookie } }), origin, adapter, fixture.store, new AbortController().signal)
    expect(second.body.csrfToken).toBe(first.body.csrfToken)
    expect(second.cookie).toBeUndefined()
    const auxiliaryHandler = auxiliaryWorker(origin, adapter, fixture.store)
    async function auxiliary(token: string) {
      return auxiliaryHandler.fetch(new Request(origin, { method: "POST", body: "{}", headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookie, "X-RMC-CSRF-Token": token } }))
    }
    expect((await auxiliary(encodeSecret(adapter.randomBytes(32)))).status).toBe(403)
    expect(auxiliaryHandler.effects()).toBe(0)
    expect((await auxiliary(first.body.csrfToken)).status).toBe(200)
    fixture.invalidate()
    expect((await auxiliary(first.body.csrfToken)).status).toBe(403)
    expect(auxiliaryHandler.effects()).toBe(1)
  })
  it("GCM purpose/binding/version/tamper and distinct key domains fail closed", async () => {
    const adapter = cryptoAdapter()
    const envelope = await adapter.seal("CSRF", adapter.randomBytes(32), "expected-context")
    expect(await adapter.open(envelope)).toHaveLength(32)
    for (const changed of [{ binding: "other" }, { purpose: "COOKIE" }, { keyVersion: 9 }, { ciphertext: new Uint8Array(60) }]) await expect(adapter.open({ ...envelope, ...changed })).rejects.toBeDefined()
    const key = encodeSecret(new Uint8Array(32))
    expect(() => new WorkerCrypto(JSON.stringify({ currentVersion: 1, versions: { 1: { cookie: key, csrf: key, rate: key } } }))).toThrow(WorkerProblem)
  })
})
