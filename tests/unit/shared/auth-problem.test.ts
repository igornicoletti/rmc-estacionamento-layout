import { describe, expect, it } from "vitest"

import { authProblemSchema, authProblemStatuses } from "@/shared/auth"

describe("application/problem+json canônico", () => {
  it("mantém o mapa fechado de códigos e status", () => {
    expect(Object.keys(authProblemStatuses)).toHaveLength(17)
    expect(authProblemStatuses.AUTH_CSRF_INVALID).toBe(403)
    expect(authProblemStatuses.AUTH_DEPENDENCY_TIMEOUT).toBe(504)
  })

  it("rejeita status divergente, código desconhecido e campos inesperados (T21)", () => {
    const base = {
      type: "about:blank",
      title: "Forbidden",
      status: 403,
      code: "AUTH_ACCESS_DENIED",
      requestId: "request_12345678",
    } as const

    expect(authProblemSchema.safeParse(base).success).toBe(true)
    expect(authProblemSchema.safeParse({ ...base, status: 401 }).success).toBe(false)
    expect(authProblemSchema.safeParse({ ...base, code: "AUTH_NEW" }).success).toBe(false)
    expect(authProblemSchema.safeParse({ ...base, stack: "secret" }).success).toBe(false)
  })
})
