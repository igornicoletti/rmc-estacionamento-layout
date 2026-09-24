import { describe, expect, it } from "vitest"

import {
  getBrazilianStateName,
  parseBrazilianStateCode,
} from "@/lib/erp/brazilian-states"

describe("Brazilian states", () => {
  it("resolve nomes canônicos das 27 UFs por sigla", () => {
    expect(getBrazilianStateName(parseBrazilianStateCode("go"))).toBe("Goiás")
    expect(getBrazilianStateName(parseBrazilianStateCode("DF"))).toBe(
      "Distrito Federal",
    )
    expect(getBrazilianStateName(parseBrazilianStateCode("es"))).toBe(
      "Espírito Santo",
    )
  })

  it("rejeita siglas desconhecidas", () => {
    expect(() => parseBrazilianStateCode("XX")).toThrow("UF brasileira válida")
  })
})
