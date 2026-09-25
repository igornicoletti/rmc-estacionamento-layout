import { describe, expect, it } from "vitest"

import {
  formatUnitCity,
  formatUnitName,
} from "@/pages/units/model/unit-presentation"

describe("unit presentation", () => {
  it("formata valores ERP em caixa alta somente para apresentação", () => {
    expect(formatUnitName("POSTO MONTE CARLO SAO JOSE LTDA")).toBe(
      "Posto Monte Carlo São José Ltda",
    )
    expect(formatUnitCity("GOIANIA")).toBe("Goiânia")
    expect(formatUnitCity("SAO JOSE DO RIO PRETO")).toBe(
      "São José do Rio Preto",
    )
  })

  it("preserva acentos e capitalização já fornecidos pela origem", () => {
    expect(formatUnitName("Posto São José Ltda")).toBe("Posto São José Ltda")
    expect(formatUnitCity("Goiânia")).toBe("Goiânia")
  })

  it("preserva acrônimos desconhecidos curtos em caixa alta", () => {
    expect(formatUnitName("ABC POSTO CENTRAL")).toBe("ABC Posto Central")
  })
})
