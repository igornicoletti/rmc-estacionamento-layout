import { describe, expect, it, vi } from "vitest"
import type { ProvisioningDatabase, ProvisioningOutcome, ProvisioningReservation } from "../../src/shared/auth/auth-provisioning"
import { WorkerProvisioningSaga } from "../src/auth/worker-provisioning-saga"

const r: ProvisioningReservation = { commandId: "01000000-0000-4000-8000-000000000001",
  identityId: "01000000-0000-4000-8000-000000000002", providerSubject: "01000000-0000-4000-8000-000000000003",
  ownershipBinding: "01000000-0000-4000-8000-000000000004", leaseOwner: "01000000-0000-4000-8000-000000000005",
  identityGeneration: 1, fence: 1, leaseExpiresAt: "2026-10-01T23:59:59Z", state: "RESERVED" }
const ctx = () => ({ commandId: r.commandId, requestId: crypto.randomUUID(), signal: new AbortController().signal })
const owned: ProvisioningOutcome = { kind: "OWNED", proof: { commandId: r.commandId, providerSubject: r.providerSubject, ownershipBinding: r.ownershipBinding } }
function harness() {
  const database = {
    reserve: vi.fn(() => Promise.resolve(r)), readReservation: vi.fn(() => Promise.resolve(r)),
    claimReconciliation: vi.fn(() => Promise.resolve({ ...r, fence: 2 })),
    confirmOwnership: vi.fn(() => Promise.resolve(true)), commit: vi.fn(() => Promise.resolve(true)),
    abortConfirmedAbsent: vi.fn(() => Promise.resolve(true)), admit: vi.fn(() => Promise.resolve(true)),
    recordUnknown: vi.fn(() => Promise.resolve(true)),
  } satisfies ProvisioningDatabase
  const provider = { getReservedUser: vi.fn(() => Promise.resolve<ProvisioningOutcome>({ kind: "ABSENT" })),
    createReservedUser: vi.fn(() => Promise.resolve<ProvisioningOutcome>(owned)) }
  return { database, provider, saga: new WorkerProvisioningSaga(database, provider) }
}
describe("F04 durable saga, no distributed transaction or blind retry", () => {
  it("reserves before read/create and confirms ownership before atomic commit", async () => {
    const { saga, database, provider } = harness()
    expect(await saga.start(r.commandId, 1, r.leaseOwner, ctx())).toEqual({ kind: "COMMITTED", identityId: r.identityId })
    expect(database.reserve).toHaveBeenCalledBefore(provider.getReservedUser)
    expect(provider.getReservedUser).toHaveBeenCalledBefore(provider.createReservedUser)
    expect(database.confirmOwnership).toHaveBeenCalledBefore(vi.mocked(database.commit))
    expect(database.abortConfirmedAbsent).not.toHaveBeenCalled()
  })
  it("does not dispatch when initial lookup is unknown, conflicting or malformed", async () => {
    for (const outcome of [{ kind: "UNKNOWN" }, { kind: "CONFLICT" }]) {
      const { saga, provider, database } = harness()
      provider.getReservedUser.mockResolvedValue(outcome as ProvisioningOutcome)
      const result = await saga.start(r.commandId, 1, r.leaseOwner, ctx())
      expect(result.kind).toBe(outcome.kind === "CONFLICT" ? "CONFLICT" : "PENDING")
      expect(provider.createReservedUser).not.toHaveBeenCalled()
      expect(database.commit).not.toHaveBeenCalled()
    }
  })
  it("lost creation response remains durable pending; later owned lookup commits without another create", async () => {
    const { saga, provider, database } = harness()
    provider.createReservedUser.mockResolvedValue({ kind: "UNKNOWN" })
    expect(await saga.start(r.commandId, 1, r.leaseOwner, ctx())).toEqual({ kind: "PENDING" })
    expect(database.recordUnknown).toHaveBeenCalledOnce()
    provider.getReservedUser.mockResolvedValue(owned)
    expect(await saga.reconcile(r.commandId, r.leaseOwner, ctx())).toEqual({ kind: "COMMITTED", identityId: r.identityId })
    expect(provider.createReservedUser).toHaveBeenCalledOnce()
  })
  it("404 during reconciliation never aborts a potentially in-flight creation", async () => {
    const { saga, provider, database } = harness()
    expect(await saga.reconcile(r.commandId, r.leaseOwner, ctx())).toEqual({ kind: "PENDING" })
    expect(provider.createReservedUser).not.toHaveBeenCalled()
    expect(database.abortConfirmedAbsent).not.toHaveBeenCalled()
    expect(database.recordUnknown).toHaveBeenCalledOnce()
  })
  it("durable terminal replay needs no provider, claim or duplicated audit commit", async () => {
    const { saga, database, provider } = harness()
    vi.mocked(database.reserve).mockResolvedValue({ ...r, state: "COMMITTED" })
    expect(await saga.start(r.commandId, 1, r.leaseOwner, ctx())).toEqual({ kind: "COMMITTED", identityId: r.identityId })
    expect(provider.getReservedUser).not.toHaveBeenCalled()
    expect(provider.createReservedUser).not.toHaveBeenCalled()
    expect(database.commit).not.toHaveBeenCalled()
  })
  it("does not borrow the previous owner's lease to perform an external operation", async () => {
    const { saga, provider } = harness()
    expect(await saga.start(r.commandId, 1, crypto.randomUUID(), ctx())).toEqual({ kind: "PENDING" })
    expect(provider.getReservedUser).not.toHaveBeenCalled()
    expect(provider.createReservedUser).not.toHaveBeenCalled()
  })
  it("denies altered proof, binding, malformed input and stale confirmation", async () => {
    const { saga, database, provider } = harness()
    provider.getReservedUser.mockResolvedValue({ kind: "OWNED", proof: { ...owned.proof, ownershipBinding: crypto.randomUUID() } })
    expect((await saga.start(r.commandId, 1, r.leaseOwner, ctx())).kind).toBe("CONFLICT")
    expect(database.confirmOwnership).not.toHaveBeenCalled()
    expect((await saga.start("unknown", 1, r.leaseOwner, ctx())).kind).toBe("CONFLICT")
    provider.getReservedUser.mockResolvedValue(owned)
    vi.mocked(database.confirmOwnership).mockResolvedValue(false)
    expect((await saga.reconcile(r.commandId, r.leaseOwner, ctx())).kind).toBe("PENDING")
    expect(database.commit).not.toHaveBeenCalled()
  })
  it("audit/DB failure or cancelled request cannot be reported as committed or confirmed absent", async () => {
    const { saga, database } = harness()
    vi.mocked(database.commit).mockRejectedValue(new Error("SQL sensitive payload"))
    expect(await saga.start(r.commandId, 1, r.leaseOwner, ctx())).toEqual({ kind: "PENDING" })
    expect(database.abortConfirmedAbsent).not.toHaveBeenCalled()
    expect(await saga.start(r.commandId, 1, r.leaseOwner, { ...ctx(), signal: AbortSignal.abort() })).toEqual({ kind: "PENDING" })
  })
})
