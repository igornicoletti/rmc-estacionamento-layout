import { describe, expect, it } from "vitest"

import {
  createAppQueryClient,
  getQueryRetryDelay,
  shouldRetryQuery,
} from "@/app/root/query-client"

describe("query policy", () => {
  it("tenta novamente apenas falhas recuperáveis e com limite", () => {
    expect(shouldRetryQuery(0, new Response(null, { status: 500 }))).toBe(true)
    expect(shouldRetryQuery(0, new Response(null, { status: 404 }))).toBe(false)
    expect(shouldRetryQuery(0, { status: 999 })).toBe(false)
    expect(shouldRetryQuery(0, new TypeError("invalid payload"))).toBe(false)
    expect(shouldRetryQuery(2, new TypeError("network"))).toBe(false)
  })

  it("respeita Retry-After antes de usar backoff exponencial", () => {
    const throttled = new Response(null, {
      headers: { "Retry-After": "7" },
      status: 429,
    })

    expect(getQueryRetryDelay(0, throttled)).toBe(7_000)
    expect(getQueryRetryDelay(0, new Error("offline"))).toBe(1_000)
    expect(getQueryRetryDelay(10, new Error("offline"))).toBe(30_000)
  })

  it("declara defaults seguros sem desativar revalidação por foco", () => {
    const defaults = createAppQueryClient().getDefaultOptions()

    expect(defaults.mutations?.retry).toBe(false)
    expect(defaults.queries?.staleTime).toBe(30_000)
    expect(defaults.queries?.gcTime).toBe(600_000)
    expect(defaults.queries?.refetchOnWindowFocus).toBeUndefined()
    expect(defaults.queries?.retryDelay).toBe(getQueryRetryDelay)
  })
})
