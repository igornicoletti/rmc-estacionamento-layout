import { describe, expect, it } from "vitest"

import {
  createAppQueryClient,
  shouldRetryQuery,
} from "@/app/query-client"

describe("query policy", () => {
  it("tenta novamente apenas falhas recuperáveis e com limite", () => {
    expect(shouldRetryQuery(0, new Response(null, { status: 500 }))).toBe(true)
    expect(shouldRetryQuery(0, new Response(null, { status: 404 }))).toBe(false)
    expect(shouldRetryQuery(0, { status: 999 })).toBe(false)
    expect(shouldRetryQuery(0, new TypeError("invalid payload"))).toBe(false)
    expect(shouldRetryQuery(2, new TypeError("network"))).toBe(false)
  })

  it("declara defaults seguros", () => {
    const defaults = createAppQueryClient().getDefaultOptions()

    expect(defaults.mutations?.retry).toBe(false)
    expect(defaults.queries?.staleTime).toBe(30_000)
    expect(defaults.queries?.gcTime).toBe(600_000)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
  })
})
