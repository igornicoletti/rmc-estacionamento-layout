import { describe, expect, it } from "vitest"

import { loadPreviewUnits } from "@/pages/units/data/unit-preview-data"

describe("unit preview data", () => {
  it("fornece uma coleção sintética determinística sem metadados internos", () => {
    const units = loadPreviewUnits()

    expect(units).toHaveLength(18)
    expect(units[0]).not.toHaveProperty("sourceHash")
    expect(units.find((unit) => unit.stateCode === "GO")?.state).toBe("Goiás")
    expect(JSON.stringify(units)).not.toMatch(
      /192\.168\.|10\.\d+\.|nom_banco_dados/u,
    )
  })
})
