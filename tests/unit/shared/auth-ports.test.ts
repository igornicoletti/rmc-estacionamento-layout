import { describe, expectTypeOf, it } from "vitest"

import type {
  AuthenticatedSession,
  AuthProblem,
  AuthProvider,
  AuthRole,
  AuditSink,
  Clock,
  CryptoProvider,
  DatabaseGateway,
  QueuePublisher,
  SmsGateway,
} from "@/shared/auth"

describe("portas puras de Auth", () => {
  it("expõe contratos tipados sem selecionar adapters", () => {
    expectTypeOf<AuthRole>().toEqualTypeOf<"S" | "A" | "R" | "M" | "O">()
    expectTypeOf<AuthenticatedSession>().toHaveProperty("freshUntil")
    expectTypeOf<AuthProblem>().toHaveProperty("requestId")
    expectTypeOf<Clock>().toHaveProperty("now")
    expectTypeOf<CryptoProvider>().toHaveProperty("seal")
    expectTypeOf<AuthProvider>().toHaveProperty("verifyPassword")
    expectTypeOf<DatabaseGateway>().toHaveProperty("readSessionSnapshot")
    expectTypeOf<SmsGateway>().toHaveProperty("readOutcome")
    expectTypeOf<QueuePublisher>().toHaveProperty("publish")
    expectTypeOf<AuditSink>().toHaveProperty("append")
  })
})
