import { describe, expect, expectTypeOf, it } from "vitest"

import { auditEventSchema } from "@/shared/auth/auth-audit"
import { cpfEnvelopeSchema, provisioningOutcomeSchema, provisioningReservationSchema } from "@/shared/auth/auth-provisioning"
import type { CpfCrypto, CpfDatabase, ProvisioningDatabase, ProvisioningProvider } from "@/shared/auth/auth-provisioning"

const id = "01000000-0000-4000-8000-000000000001"
describe("contratos de prontidão provisioning", () => {
  it("mantém portas estreitas sem SDK ou transação aberta durante provider", () => {
    expectTypeOf<ProvisioningProvider>().toHaveProperty("deleteOwnedUser")
    expectTypeOf<ProvisioningDatabase>().toHaveProperty("claimReconciliation")
    expectTypeOf<CpfCrypto>().toHaveProperty("openCpf")
    expectTypeOf<CpfDatabase>().toHaveProperty("writeSource")
  })
  it("nega mensagens, segredos e estados desconhecidos no audit", () => {
    const event = { eventId: id, requestId: id, eventType: "ADMIN_COMMAND_OUTCOME", outcome: "SUCCESS", reasonCode: "PROVISION_COMMITTED", occurredAt: "2026-10-01T00:00:00Z", deployment: "LOCAL", contractVersion: "1.1" }
    expect(auditEventSchema.safeParse(event).success).toBe(true)
    for (const reasonCode of ["DAY_ZERO_COMPLETE", "PROVISION_COMPENSATION_FENCED", "PROVISION_COMPENSATED"]) {
      expect(auditEventSchema.safeParse({ ...event, reasonCode }).success).toBe(true)
    }
    for (const extra of [{ body: "secret" }, { reasonCode: "SQL_ERROR_TEXT" }, { outcome: "unexpected" }, { capability: "unknown" }, { reasonCode: undefined }, { contractVersion: "1.0" }]) {
      expect(auditEventSchema.safeParse({ ...event, ...extra }).success).toBe(false)
    }
  })
  it("separa ausência comprovada de outcome desconhecido e exige binding", () => {
    for (const kind of ["ABSENT", "UNKNOWN", "CONFLICT"]) expect(provisioningOutcomeSchema.safeParse({ kind }).success).toBe(true)
    expect(provisioningOutcomeSchema.safeParse({ kind: "OWNED" }).success).toBe(false)
    expect(provisioningOutcomeSchema.safeParse({ kind: "OWNED", proof: { providerSubject: id, commandId: id, ownershipBinding: id } }).success).toBe(true)
    expect(provisioningOutcomeSchema.safeParse({ kind: "ABSENT", reason: "timeout" }).success).toBe(false)
  })
  it("valida envelope CPF privado e reserva com fence", () => {
    const envelope = { codecVersion: 1, algorithm: "A256GCM", purpose: "CPF", identityId: id, generation: 1, keyVersion: 1, ciphertext: new Uint8Array(39) }
    expect(cpfEnvelopeSchema.safeParse(envelope).success).toBe(true)
    for (const extra of [{ purpose: "CSRF" }, { ciphertext: new Uint8Array(60) }, { plaintext: "123" }, { keyVersion: 0 }]) expect(cpfEnvelopeSchema.safeParse({ ...envelope, ...extra }).success).toBe(false)
    const reservation = { commandId: id, identityId: id, providerSubject: id, ownershipBinding: id, identityGeneration: 1, fence: 1, leaseOwner: id, leaseExpiresAt: "2026-10-01T00:00:00Z", state: "RESERVED" }
    expect(provisioningReservationSchema.safeParse(reservation).success).toBe(true)
    expect(provisioningReservationSchema.safeParse({ ...reservation, fence: 0 }).success).toBe(false)
  })
})
