import { describe, expect, it } from "vitest"

import {
  formatCnpj,
  mapLegacyUnit,
  mapLegacyUnits,
  normalizePortugueseName,
} from "@/pages/units/model/unit-mapper"

const validRecord = {
  cod_empresa: 1,
  nom_razao_social: "POSTO MONTE CARLO SAO JOSE LTDA",
  nom_fantasia: "SAO JOSE",
  num_cnpj: "21384959000148",
  cod_bandeira: 51,
  des_bandeira: "BANDEIRA BRANCA",
  cod_cidade: 1,
  nom_cidade: "SAO JOSE DO RIO PRETO",
  nom_estado: "SAO PAULO",
  sgl_estado: "sp",
  des_coordenada_empresa: "-20.8646651, -49.4135844",
  ip_rede: "192.168.9.190",
  nom_banco_dados: "IGUA",
  source_hash: "ABC123",
  source_updated_at: null,
  synced_at: "2026-08-01 15:00:04.67+00",
  created_at: "2026-08-01 06:44:30.89959+00",
  updated_at: "2026-08-01 15:00:04.792792+00",
}

describe("unit mapper", () => {
  it("normaliza o contrato legado para apresentação em português", () => {
    expect(mapLegacyUnit(validRecord)).toMatchObject({
      id: "1",
      legalName: "Posto Monte Carlo São José Ltda.",
      tradeName: "São José",
      cnpj: "21.384.959/0001-48",
      brand: "Bandeira Branca",
      city: "São José do Rio Preto",
      state: "São Paulo",
      stateCode: "SP",
      coordinates: "-20.864665, -49.413584",
      networkAddress: "192.168.9.190",
      databaseName: "igua",
      sourceHash: "abc123",
      sourceUpdatedAt: null,
    })
  })

  it("descarta coordenada e endereço de rede opcionais inválidos", () => {
    expect(mapLegacyUnit({
      ...validRecord,
      des_coordenada_empresa: "",
      ip_rede: "XXX",
    })).toMatchObject({ coordinates: null, networkAddress: null })
  })

  it("rejeita respostas e campos obrigatórios inválidos", () => {
    expect(() => mapLegacyUnits({})).toThrow("deve ser um array")
    expect(() => mapLegacyUnit({ ...validRecord, cod_empresa: 1.5 })).toThrow("cod_empresa")
    expect(() => formatCnpj("123")).toThrow("14 dígitos")
    expect(() => formatCnpj("11111111111111")).toThrow("validação")
  })

  it("preserva conectores em minúsculas", () => {
    expect(normalizePortugueseName("AUTO POSTO DA CIDADE")).toBe("Auto Posto da Cidade")
  })
})
