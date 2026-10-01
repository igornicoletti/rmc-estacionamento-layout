import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { createHttpClient, parseRetryAfter } from "@/lib/http/http-client"
import { authContextResponseSchema, authEndpoints, authHttpPolicy, authSecretSchema } from "@/shared/auth/auth-http-contracts"
import { readHttpBytes } from "@/lib/http/http-stream"

const operation = authEndpoints.health
const problem = (status = 503, code = "AUTH_DEPENDENCY_UNAVAILABLE", retry?: string) => Response.json({
  type: "about:blank", title: "Service Unavailable", status, code, requestId: "synthetic-request",
}, { status, headers: { "Content-Type": "application/problem+json", ...(retry ? { "Retry-After": retry } : {}) } })

describe("F03 HTTP client", () => {
  it("context rejects unknown policy/purpose, expiry and unexpected authority properties", () => {
    const value = { contractVersion: "1.0", policyVersion: "auth-v1", serverTime: "2026-10-01T00:00:00Z",
      contextId: "10000000-0000-4000-8000-000000000003", authority: { purpose: "PREAUTH", generation: 1, expiresAt: "2026-10-01T00:30:00Z" }, csrfToken: "A".repeat(43) }
    expect(authContextResponseSchema.safeParse(value).success).toBe(true)
    for (const changed of [{ policyVersion: "unknown" }, { authority: { ...value.authority, purpose: "UNKNOWN" } },
      { authority: { ...value.authority, expiresAt: value.serverTime } }, { authority: { ...value.authority, secret: "unexpected" } }]) {
      expect(authContextResponseSchema.safeParse({ ...value, ...changed }).success).toBe(false)
    }
  })
  it("validates DTO and fixed same-origin fetch semantics", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: "ok" }))
    expect(await createHttpClient({ fetcher }).request(operation)).toEqual({ kind: "success", value: { status: "ok" } })
    expect(fetcher).toHaveBeenCalledWith("/api/health", expect.objectContaining({ credentials: "same-origin", mode: "same-origin", cache: "no-store", redirect: "error" }))
  })
  it.each([null, {}, { status: "unknown" }, { status: "ok", secret: "unexpected" }])("fails closed on malformed success %j", async (value) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(value))
    expect(await createHttpClient({ fetcher }).request(operation)).toEqual({ kind: "invalid-payload" })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it("rejects success/error MIME, malformed UTF8/JSON and response overflow", async () => {
    for (const response of [new Response("HTML"), new Response("nojson", { headers: { "Content-Type": "application/json" } }),
      new Response(new Uint8Array([255]), { headers: { "Content-Type": "application/json" } }),
      new Response("x".repeat(authHttpPolicy.responseBytes + 1), { headers: { "Content-Type": "application/json" } }),
      new Response("private stack", { status: 500 })]) {
      expect(await createHttpClient({ fetcher: vi.fn<typeof fetch>().mockResolvedValue(response) }).request(operation)).toEqual({ kind: "invalid-payload" })
    }
  })
  it.each(["Authorization", "Cookie", "apikey", "X-RMC-CSRF-Token", "X-Role", "X-AAL"])("does not admit caller header %s", async (name) => {
    const fetcher = vi.fn<typeof fetch>()
    expect(await createHttpClient({ fetcher }).request(operation, { headers: { [name]: "not-trusted" } })).toEqual({ kind: "invalid-request" })
    expect(fetcher).not.toHaveBeenCalled()
  })
  it("retries one eligible GET, accepts dates/seconds, and never clamps long Retry-After", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(problem(503, undefined, "0")).mockResolvedValueOnce(Response.json({ status: "ok" }))
    expect((await createHttpClient({ fetcher }).request(operation)).kind).toBe("success")
    expect(fetcher).toHaveBeenCalledTimes(2)
    const delayed = vi.fn<typeof fetch>().mockResolvedValue(problem(503, undefined, "300"))
    expect(await createHttpClient({ fetcher: delayed }).request(operation)).toMatchObject({ kind: "http", retryAfterMs: 300000 })
    expect(delayed).toHaveBeenCalledTimes(1)
    expect(parseRetryAfter("10", 0)).toBe(10000)
    expect(parseRetryAfter("Thu, 01 Oct 2026 10:00:10 GMT", Date.parse("2026-10-01T10:00:00Z"))).toBe(10000)
    for (const value of ["-1", "1.5", "October 1", "1e6", "999999999999999999999"]) expect(parseRetryAfter(value, 0)).toBeUndefined()
  })
  it("never retries mutation or treats 403 as logout", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(problem())
    const client = createHttpClient({ fetcher })
    client.setCsrfToken("A".repeat(43))
    const result = await client.request({ method: "POST", path: "/api/auth/login", input: z.strictObject({}), body: {}, response: z.strictObject({}) })
    expect(result.kind).toBe("http")
    expect(fetcher).toHaveBeenCalledTimes(1)
    const forbidden = createHttpClient({ fetcher: vi.fn<typeof fetch>().mockResolvedValue(problem(403, "AUTH_ACCESS_DENIED")) })
    expect(await forbidden.request(operation)).toMatchObject({ kind: "http", problem: { status: 403 } })
  })
  it("retries eligible intermediary status without accepting an unknown problem", async () => {
    for (const status of [408, 425]) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(problem(status, "UNKNOWN", "0")).mockResolvedValueOnce(Response.json({ status: "ok" }))
      expect((await createHttpClient({ fetcher }).request(operation)).kind).toBe("success")
      expect(fetcher).toHaveBeenCalledTimes(2)
    }
  })
  it("rejects external paths and unserializable command input before fetch", async () => {
    const fetcher = vi.fn<typeof fetch>()
    const client = createHttpClient({ fetcher })
    expect(await client.request({ ...operation, path: "https://other.invalid/api/health" as typeof operation.path })).toEqual({ kind: "invalid-request" })
    client.setCsrfToken("A".repeat(43))
    expect(await client.request({ path: "/api/auth/login", method: "POST", input: z.unknown(), body: 1n, response: z.unknown() })).toEqual({ kind: "invalid-request" })
    expect(fetcher).not.toHaveBeenCalled()
  })
  it("honors cancellation and per-attempt timeout without leaked timers", async () => {
    const cancelled = vi.fn<typeof fetch>()
    expect(await createHttpClient({ fetcher: cancelled }).request(operation, { signal: AbortSignal.abort() })).toEqual({ kind: "aborted" })
    expect(cancelled).not.toHaveBeenCalled()
    vi.useFakeTimers()
    try {
      const controller = new AbortController()
      const fetcher: typeof fetch = (_input, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("Aborted")), { once: true })
      })
      const pending = createHttpClient({ fetcher }).request(operation, { signal: controller.signal })
      controller.abort()
      expect(await pending).toEqual({ kind: "aborted" })
      expect(vi.getTimerCount()).toBe(0)
      const timeout = createHttpClient({ fetcher }).request({ method: "POST", path: "/api/auth/login", input: z.strictObject({}), response: z.strictObject({}), body: {} })
      // Without CSRF, rejected before transport; no dangling timer.
      expect(await timeout).toEqual({ kind: "invalid-request" })
      const client = createHttpClient({ fetcher })
      client.setCsrfToken("A".repeat(43))
      const mutation = client.request({ method: "POST", path: "/api/auth/login", input: z.strictObject({}), response: z.strictObject({}), body: {} })
      await vi.advanceTimersByTimeAsync(15000)
      expect(await mutation).toEqual({ kind: "timeout" })
      expect(vi.getTimerCount()).toBe(0)
    } finally { vi.useRealTimers() }
  })
  it("bounded reader cancels overflow and rejects noncanonical base64url secrets", async () => {
    let cancelled = false
    const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array(11)) }, cancel() { cancelled = true } })
    await expect(readHttpBytes(stream, 10, new AbortController().signal)).rejects.toThrow(RangeError)
    expect(cancelled).toBe(true)
    expect(authSecretSchema.safeParse("A".repeat(42) + "B").success).toBe(false)
  })
})
