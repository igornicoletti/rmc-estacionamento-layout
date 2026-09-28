import { describe, expect, it } from "vitest"

import { loadDemoUnits } from "@/features/units/queries/units-query"

describe("unit preview data", () => {
  it("fornece as unidades do espelho histórico sem metadados internos", () => {
    const units = loadDemoUnits()

    expect(units).toHaveLength(61)
    expect(units[0]).not.toHaveProperty("sourceHash")
    expect(units[0]?.tradeName).toBe("IGUATEMI")
    expect(new Set(units.map((unit) => unit.id)).size).toBe(61)
    for (const unit of units) {
      expect(unit).not.toHaveProperty("ip_rede")
      expect(unit).not.toHaveProperty("nom_banco_dados")
      expect(unit).not.toHaveProperty("synced_at")
    }
  })
})
