import { describe, expect, expectTypeOf, it } from "vitest"

import { auditEventTypes } from "@/shared/auth/auth-audit"

import type {
  AuthenticatedSession,
  AuthRole,
} from "@/shared/auth/auth-contracts"
import type { AuthProblem } from "@/shared/auth/auth-errors"
import type {
  AuditSink,
  AuthProvider,
  Clock,
  CryptoProvider,
  DatabaseGateway,
  QueuePublisher,
  SmsGateway,
} from "@/shared/auth/auth-ports"

describe("portas puras de Auth", () => {
  it("expõe somente contratos tipados da fronteira F01 sem selecionar adapters", () => {
    expect(auditEventTypes).toHaveLength(11)
    expectTypeOf<AuthRole>().toEqualTypeOf<"S" | "A" | "R" | "M" | "O">()
    expectTypeOf<AuthenticatedSession>().toHaveProperty("policyVersion")
    expectTypeOf<AuthProblem>().toHaveProperty("requestId")
    expectTypeOf<Clock>().toHaveProperty("now")
    expectTypeOf<AuthProvider>().toHaveProperty("verifyPassword")
    expectTypeOf<DatabaseGateway>().toHaveProperty("readSessionSnapshot")
    expectTypeOf<SmsGateway>().toHaveProperty("readOutcome")
    expectTypeOf<CryptoProvider>().toHaveProperty("seal")
    expectTypeOf<QueuePublisher>().toHaveProperty("publish")
    expectTypeOf<AuditSink>().toHaveProperty("append")
  })
})
