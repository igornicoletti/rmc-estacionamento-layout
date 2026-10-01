import { describe, expect, it } from "vitest"

import { formatCnpj } from "@/lib/erp/erp-tax-id"
import { mapErpUnit, mapErpUnits } from "@/features/units/mapping/units-mapper"

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
}

describe("unit mapper", () => {
  it("preserva nomes canônicos do ERP e normaliza apenas tipos técnicos", () => {
    expect(mapErpUnit(validRecord)).toMatchObject({
      id: "1",
      legalName: "POSTO MONTE CARLO SAO JOSE LTDA",
      tradeName: "SAO JOSE",
      cnpj: "21.384.959/0001-48",
      brand: "BANDEIRA BRANCA",
      city: "SAO JOSE DO RIO PRETO",
      state: "SAO PAULO",
      stateCode: "SP",
      coordinates: "-20.864665, -49.413584",
    })
  })

  it("preserva o nome do estado recebido e normaliza sua UF", () => {
    expect(
      mapErpUnit({
        ...validRecord,
        nom_estado: "GOIAS",
        sgl_estado: "go",
      }).state,
    ).toBe("GOIAS")
    expect(
      mapErpUnit({
        ...validRecord,
        nom_estado: "DISTRITO FEDERAL",
        sgl_estado: "df",
      }).state,
    ).toBe("DISTRITO FEDERAL")
    expect(
      mapErpUnit({
        ...validRecord,
        nom_estado: "ESPIRITO SANTO",
        sgl_estado: "es",
      }).state,
    ).toBe("ESPIRITO SANTO")
  })

  it("aceita identificador inteiro em número, string ou bigint", () => {
    expect(mapErpUnit({ ...validRecord, cod_empresa: "42" }).id).toBe("42")
    expect(mapErpUnit({ ...validRecord, cod_empresa: 42n }).id).toBe("42")
  })

  it("descarta coordenadas opcionais inválidas e ignora metadados internos", () => {
    expect(
      mapErpUnit({
        ...validRecord,
        des_coordenada_empresa: "",
        ip_rede: "XXX",
      }),
    ).toMatchObject({ coordinates: null })
  })

  it("rejeita respostas e campos obrigatórios inválidos", () => {
    expect(() => mapErpUnits({})).toThrow("deve ser um array")
    expect(() => mapErpUnit({ ...validRecord, cod_empresa: 1.5 })).toThrow(
      "cod_empresa",
    )
    expect(() => mapErpUnit({ ...validRecord, sgl_estado: "XX" })).toThrow(
      "UF brasileira válida",
    )
    expect(() => formatCnpj("123")).toThrow("14 dígitos")
    expect(() => formatCnpj("11111111111111")).toThrow("validação")
  })
})
