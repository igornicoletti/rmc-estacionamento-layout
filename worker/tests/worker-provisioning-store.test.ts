import { afterEach, describe, expect, it, vi } from "vitest"
import { createProvisioningStore } from "../src/auth/worker-provisioning-store"

const commandId = "01000000-0000-4000-8000-000000000001"
const row = { command_id: commandId, identity_id: "01000000-0000-4000-8000-000000000002",
  provider_subject: "01000000-0000-4000-8000-000000000003", ownership_binding: "01000000-0000-4000-8000-000000000004",
  lease_owner: "01000000-0000-4000-8000-000000000005", identity_generation: 1, fence: 1,
  lease_expires_at: "2026-10-01T22:00:00+00:00", state: "RESERVED", confirmed_at: null,
  created_at: "2026-10-01T21:59:30+00:00", dispatch_claimed: false,
  reconcile_attempts: 0, next_reconcile_at: "2026-10-01T21:59:30+00:00", reconcile_deadline: "2026-10-02T21:59:30+00:00" }
const ctx = () => ({ commandId, requestId: crypto.randomUUID(), signal: new AbortController().signal })
const store = () => createProvisioningStore("http://127.0.0.1:55321", "synthetic-key")
afterEach(() => vi.unstubAllGlobals())
describe("F04 RPC-only provisioning store", () => {
  it("decodes one PostgREST composite with no extras and preserves binding/fence", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json([row]))))
    const r = await store().reserve(commandId, 1, row.lease_owner, ctx())
    expect(r.providerSubject).toBe(row.provider_subject)
    expect(r.fence).toBe(1)
    expect(r.leaseExpiresAt).toBe("2026-10-01T22:00:00.000Z")
  })
  it("rejects wrong cardinality, changed command, unknown state and inconsistent confirmation", async () => {
    for (const value of [[row, row], [{ ...row, command_id: crypto.randomUUID() }], [{ ...row, state: "NEW" }], [{ ...row, state: "CONFIRMED" }], [{ ...row, plaintext: "secret" }]]) {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json(value))))
      await expect(store().readReservation(commandId, ctx())).rejects.toThrow("AUTH_PROVIDER_FAILURE")
    }
  })
  it("handles no row, rejects nonboolean mutation outcome and sends complete commit context", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json([]))))
    expect(await store().readReservation(commandId, ctx())).toBeNull()
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json([row]))))
    const db = store(), context = ctx()
    const r = await db.reserve(commandId, 1, row.lease_owner, context)
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof init?.body !== "string") throw new Error("Expected RPC JSON")
      const args: unknown = JSON.parse(init.body)
      expect(args).toEqual({ p_command: commandId, p_owner: row.lease_owner, p_fence: 1, p_request: context.requestId, p_deployment: "LOCAL" })
      expect(init.redirect).toBe("manual")
      expect(new Headers(init.headers).get("Cookie")).toBeNull()
      return Promise.resolve(Response.json(true))
    })
    vi.stubGlobal("fetch", fetchMock)
    expect(await db.commit(r, context)).toBe(true)
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json({ committed: true }))))
    await expect(db.commit(r, context)).rejects.toThrow("AUTH_PROVIDER_FAILURE")
  })
  it("denies altered ownership before RPC and sends one CAS admission with exact authority", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json([row]))))
    const db = store(), context = ctx(), r = await db.reserve(commandId, 1, row.lease_owner, context)
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof init?.body !== "string") throw new Error("Expected RPC JSON")
      expect(JSON.parse(init.body) as unknown).toEqual({ p_command: commandId, p_owner: row.lease_owner, p_fence: 1,
        p_provider: row.provider_subject, p_binding: row.ownership_binding, p_generation: 1, p_mutation: true })
      return Promise.resolve(Response.json(false))
    })
    vi.stubGlobal("fetch", fetchMock)
    expect(await db.confirmOwnership(r, { commandId, providerSubject: row.provider_subject, ownershipBinding: crypto.randomUUID() }, context)).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(await db.admit(r, context, true)).toBe(false)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
