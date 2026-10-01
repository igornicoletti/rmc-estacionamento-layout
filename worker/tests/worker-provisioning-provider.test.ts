import { afterEach, describe, expect, it, vi } from "vitest"
import { WorkerProvisioningProvider, provisioningOwnership } from "../src/auth/worker-provisioning-provider"

const reservation = {
  commandId: "01000000-0000-4000-8000-000000000001", identityId: "01000000-0000-4000-8000-000000000002",
  providerSubject: "01000000-0000-4000-8000-000000000003", ownershipBinding: "01000000-0000-4000-8000-000000000004",
  leaseOwner: "01000000-0000-4000-8000-000000000005", identityGeneration: 1, fence: 1,
  leaseExpiresAt: "2026-10-01T23:59:59Z", state: "RESERVED" as const,
}
const context = () => ({ commandId: reservation.commandId, requestId: crypto.randomUUID(), signal: new AbortController().signal })
const user = () => ({ id: reservation.providerSubject, email: `u-${reservation.providerSubject}@auth.rmc.invalid`,
  phone: "", app_metadata: { rmc_provisioning: provisioningOwnership(reservation) } })
const client = (admit = () => Promise.resolve(true)) => new WorkerProvisioningProvider("http://127.0.0.1:55321", "synthetic-test-key", admit)
afterEach(() => vi.unstubAllGlobals())

describe("F04 local provider create/read boundary", () => {
  it("creates once with reserved UUID, server-only proof and uncommunicated random credential", async () => {
    const bodies: Array<Record<string, unknown>> = []
    const requests: Array<RequestInit | undefined> = []
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof init?.body !== "string") throw new Error("Expected JSON body")
      const body: unknown = JSON.parse(init.body)
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected JSON object")
      bodies.push(body as Record<string, unknown>); requests.push(init)
      return Promise.resolve(Response.json(user()))
    })
    vi.stubGlobal("fetch", fetchMock)
    const result = await client().createReservedUser(reservation, context())
    expect(result.kind).toBe("OWNED")
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(bodies[0]).toMatchObject({ id: reservation.providerSubject, phone_confirm: false,
      app_metadata: { rmc_provisioning: provisioningOwnership(reservation) } })
    expect(bodies[0]).not.toHaveProperty("phone")
    expect(bodies[0]).not.toHaveProperty("user_metadata")
    expect(bodies[0].password).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(result).not.toHaveProperty("password")
    expect(requests[0]?.redirect).toBe("manual")
    await client().createReservedUser(reservation, context())
    expect(bodies[0].password).not.toBe(bodies[1].password)
  })
  it("never calls provider for stale admission, altered command, terminal state or cancelled request", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock)
    expect(await client(() => Promise.resolve(false)).createReservedUser(reservation, context())).toEqual({ kind: "UNKNOWN" })
    expect(await client().createReservedUser(reservation, { ...context(), commandId: crypto.randomUUID() })).toEqual({ kind: "CONFLICT" })
    expect(await client().createReservedUser({ ...reservation, state: "COMMITTED" }, context())).toEqual({ kind: "CONFLICT" })
    expect(await client().createReservedUser(reservation, { ...context(), signal: AbortSignal.abort() })).toEqual({ kind: "UNKNOWN" })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(() => new WorkerProvisioningProvider("https://remote.invalid", "key", () => Promise.resolve(true))).toThrow()
  })
  it("accepts absence only for exact lookup not-found, not creation or an unavailable dependency", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json({ code: "user_not_found", msg: "not found" },
      { status: 404, headers: { "X-Supabase-Api-Version": "2024-01-01" } }))))
    expect(await client().getReservedUser(reservation, context())).toEqual({ kind: "ABSENT" })
    expect(await client().createReservedUser(reservation, context())).toEqual({ kind: "UNKNOWN" })
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json({ code: "user_not_found" }, { status: 404 }))))
    expect(await client().getReservedUser(reservation, context())).toEqual({ kind: "UNKNOWN" })
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json({ code: "unexpected_failure" }, { status: 503 }))))
    expect(await client().getReservedUser(reservation, context())).toEqual({ kind: "UNKNOWN" })
  })
  it("never adopts UUID mismatch, mutated app metadata, confirmed phone or user_metadata-only proof", async () => {
    const altered = [
      { ...user(), id: crypto.randomUUID() },
      { ...user(), app_metadata: { rmc_provisioning: { ...provisioningOwnership(reservation), commandId: crypto.randomUUID() } } },
      { ...user(), phone_confirmed_at: "2026-10-01T00:00:00Z" },
      { ...user(), app_metadata: {}, user_metadata: { rmc_provisioning: provisioningOwnership(reservation) } },
    ]
    for (const value of altered) {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json(value))))
      expect(await client().getReservedUser(reservation, context())).toEqual({ kind: "CONFLICT" })
    }
  })
  it("classifies lost response, redirect, invalid MIME/JSON and oversized payload as UNKNOWN without retry", async () => {
    const responses = [
      () => { throw new Error("sensitive network message") },
      () => new Response(null, { status: 302, headers: { Location: "https://remote.invalid" } }),
      () => new Response("{}", { headers: { "Content-Type": "text/html" } }),
      () => new Response("{", { headers: { "Content-Type": "application/json" } }),
      () => Response.json({ padding: "x".repeat(65536) }),
    ]
    for (const response of responses) {
      const fetchMock = vi.fn(() => Promise.resolve(response())); vi.stubGlobal("fetch", fetchMock)
      expect(await client().createReservedUser(reservation, context())).toEqual({ kind: "UNKNOWN" })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    }
  })
  it("cancels an upstream stream when the caller aborts, without accepting partial success", async () => {
    const abort = new AbortController()
    let cancelled = false
    vi.stubGlobal("fetch", vi.fn(() => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) { controller.enqueue(new TextEncoder().encode("{")) },
        cancel() { cancelled = true },
      })
      setTimeout(() => abort.abort(), 10)
      return Promise.resolve(new Response(body, { headers: { "Content-Type": "application/json" } }))
    }))
    expect(await client().createReservedUser(reservation, { ...context(), signal: abort.signal })).toEqual({ kind: "UNKNOWN" })
    expect(cancelled).toBe(true)
  })
})
