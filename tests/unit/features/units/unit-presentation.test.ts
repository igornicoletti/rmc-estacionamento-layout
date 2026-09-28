import { describe, expect, it } from "vitest"

import {
  formatUnitCity,
  formatUnitName,
} from "@/features/units/presentation/units-format"

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

  it("preserva siglas e rodovias, mas não confunde Rio e Sul com siglas", () => {
    expect(formatUnitName("POSTO MC RIO CLARO BR-376 KM58")).toBe(
      "Posto MC Rio Claro BR-376 KM58",
    )
    expect(formatUnitName("santa fé do sul")).toBe("Santa Fé do Sul")
    expect(formatUnitName("POSTO SANTOPOLIS DO AGUAPEI LTDA")).toBe(
      "Posto Santópolis do Aguapeí Ltda",
    )
    expect(formatUnitName("2OWT - EMPREENDIMENTOS E PARTICIPACOES LTDA")).toBe(
      "2OWT - Empreendimentos e Participações Ltda",
    )
  })

  it.each([
    ["ARACARIGUAMA", "Araçariguama"],
    ["CANDIDO MOTA", "Cândido Mota"],
    ["PARIQUERA-ACU", "Pariquera-Açu"],
    ["SANTOPOLIS DO AGUAPEI", "Santópolis do Aguapeí"],
    ["VARZEA GRANDE", "Várzea Grande"],
  ])("apresenta a cidade %s com a grafia oficial", (source, display) => {
    expect(formatUnitCity(source)).toBe(display)
  })
})
