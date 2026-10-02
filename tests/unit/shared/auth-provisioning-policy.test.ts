import { describe, expect, it } from "vitest"
import { authorizeProvisioning } from "@/shared/auth/auth-provisioning-policy"
const actor = "01000000-0000-4000-8000-000000000001", target = "01000000-0000-4000-8000-000000000002"
const sessionId = "01000000-0000-4000-8000-000000000003", commandId = "01000000-0000-4000-8000-000000000004"
const facts = () => ({ policyVersion: "1.1", capability: "users.create", actor: { id: actor, role: "S", lifecycle: "ACTIVE", onboarding: "COMPLETE", generation: 1 },
  session: { identityId: actor, generation: 1, identityGeneration: 1, purpose: "NORMAL", assurance: "aal2", revoked: false, expiresAt: 600001, idleExpiresAt: 600001 },
  target: { id: target, role: "R", lifecycle: "PENDING", onboarding: "ACTIVATION_REQUIRED", generation: 1 },
  proof: { verified: true, oneTime: true, identityId: actor, sessionId, actorGeneration: 1, sessionGeneration: 1, targetGeneration: 1,
    commandId, intentHash: "11".repeat(32), verifiedAt: 300000 },
  sessionId, commandId, intentHash: "11".repeat(32), now: 600000, unitScopeVerified: false, sameUnit: false })
describe("F04 base authorization fail-closed", () => {
  it("allows only the fixed inferior hierarchy with current NORMAL aal2 bound fresh intent", () => {
    expect(authorizeProvisioning(facts())).toBe("ALLOW")
    const independent = facts(); independent.session.generation = 7; independent.proof.sessionGeneration = 7
    expect(authorizeProvisioning(independent)).toBe("ALLOW")
    for (const role of ["S", "A", "R", "M", "O"]) {
      const f = facts(); f.target.role = role
      expect(authorizeProvisioning(f)).toBe(["A", "R"].includes(role) ? "ALLOW" : "DENY")
    }
  })
  it("denies stale/future proof, different intent/session/actor, malformed and unknown values", () => {
    expect(authorizeProvisioning(null)).toBe("DENY")
    const f = facts()
    for (const proof of [{ ...f.proof, verifiedAt: 299999 }, { ...f.proof, verifiedAt: 630001 },
      { ...f.proof, intentHash: "22".repeat(32) }, { ...f.proof, sessionId: target }, { ...f.proof, verified: false }]) {
      expect(authorizeProvisioning({ ...f, proof })).toBe("DENY")
    }
    expect(authorizeProvisioning({ ...f, capability: "unknown" })).toBe("DENY")
    expect(authorizeProvisioning({ ...f, session: { ...f.session, purpose: "BOOTSTRAP" } })).toBe("DENY")
    expect(authorizeProvisioning({ ...f, session: { ...f.session, generation: 2 } })).toBe("DENY")
    expect(authorizeProvisioning({ ...f, actor: { ...f.actor, lifecycle: "BLOCKED" } })).toBe("DENY")
    expect(authorizeProvisioning({ ...f, actor: { ...f.actor, onboarding: "SECURITY_SETUP" } })).toBe("DENY")
    expect(authorizeProvisioning({ ...f, target: { ...f.target, onboarding: "COMPLETE" } })).toBe("DENY")
    expect(authorizeProvisioning({ ...f, actor: { ...f.actor, generation: 2 }, session: { ...f.session, identityGeneration: 2 } })).toBe("DENY")
  })
  it("keeps unit-scoped work closed without verified unit and same-unit manager binding", () => {
    const f = facts(); f.actor.role = "M"; f.target.role = "O"
    expect(authorizeProvisioning(f)).toBe("DENY")
    expect(authorizeProvisioning({ ...f, unitScopeVerified: true })).toBe("DENY")
    expect(authorizeProvisioning({ ...f, unitScopeVerified: true, sameUnit: true })).toBe("ALLOW")
    expect(authorizeProvisioning({ ...f, unitScopeVerified: true, sameUnit: true, target: { ...f.target, id: actor } })).toBe("DENY")
  })
})
