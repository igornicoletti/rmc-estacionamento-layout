import { afterEach, describe, expect, it, vi } from "vitest"
import { reconcileProvisioningLocal } from "../src/auth/worker-provisioning-reconciler"

const config = { enabled: true, environment: "LOCAL_PRODUCTION_LIKE", authStage: "disabled",
  url: "http://127.0.0.1:55321", secret: "synthetic-test" }
afterEach(() => vi.unstubAllGlobals())
describe("F04 scheduled reconciler stays local, bounded and durable", () => {
  it("never contacts dependencies when disabled or remote", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock)
    expect(await reconcileProvisioningLocal({ ...config, enabled: false }, new AbortController().signal)).toEqual({ kind: "SKIPPED", attempted: 0 })
    expect(await reconcileProvisioningLocal({ ...config, environment: "PRODUCTION" }, new AbortController().signal)).toEqual({ kind: "UNAVAILABLE", attempted: 0 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it("honors durable busy/circuit state without work", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(Response.json(null))); vi.stubGlobal("fetch", fetchMock)
    expect(await reconcileProvisioningLocal(config, new AbortController().signal)).toEqual({ kind: "BUSY", attempted: 0 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it("settles an empty batch and rejects malformed or duplicate/unbounded IDs", async () => {
    const mock = vi.fn().mockResolvedValueOnce(Response.json({ fence: 1, commandIds: [] })).mockResolvedValueOnce(Response.json(true))
    vi.stubGlobal("fetch", mock)
    expect(await reconcileProvisioningLocal(config, new AbortController().signal)).toEqual({ kind: "COMPLETE", attempted: 0 })
    expect(mock).toHaveBeenCalledTimes(2)
    for (const value of [{ fence: 0, commandIds: [] }, { fence: 1, commandIds: [], unknown: true },
      { fence: 1, commandIds: ["unknown"] },
      { fence: 1, commandIds: Array(2).fill("01000000-0000-4000-8000-000000000001") },
      { fence: 1, commandIds: Array(4).fill("01000000-0000-4000-8000-000000000001") }]) {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(Response.json(value))))
      expect((await reconcileProvisioningLocal(config, new AbortController().signal)).kind).toBe("UNAVAILABLE")
    }
  })
  it("cancellation cannot initiate or retry external creation", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock)
    expect((await reconcileProvisioningLocal(config, AbortSignal.abort())).kind).toBe("UNAVAILABLE")
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
