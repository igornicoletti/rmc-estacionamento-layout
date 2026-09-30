import { describe, expectTypeOf, it } from "vitest"

import type {
  AuthenticatedSession,
  AuthProblem,
  AuthProvider,
  AuthRole,
  Clock,
  DatabaseGateway,
  SmsGateway,
} from "@/shared/auth"

describe("portas puras de Auth", () => {
  it("expõe somente contratos tipados da fronteira F01 sem selecionar adapters", () => {
    expectTypeOf<AuthRole>().toEqualTypeOf<"S" | "A" | "R" | "M" | "O">()
    expectTypeOf<AuthenticatedSession>().toHaveProperty("policyVersion")
    expectTypeOf<AuthProblem>().toHaveProperty("requestId")
    expectTypeOf<Clock>().toHaveProperty("now")
    expectTypeOf<AuthProvider>().toHaveProperty("verifyPassword")
    expectTypeOf<DatabaseGateway>().toHaveProperty("readSessionSnapshot")
    expectTypeOf<SmsGateway>().toHaveProperty("readOutcome")
  })
})
