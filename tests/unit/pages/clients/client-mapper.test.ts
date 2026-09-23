import { describe, expect, it } from "vitest"

import {
  formatCpfCnpj,
  mapErpClient,
  mapErpClients,
} from "@/pages/clients/model/client-mapper"

const validRecord = {
  cod_pessoa: "123456789012345",
  nom_pessoa: "CLIENTE EXEMPLO LTDA",
  nom_fantasia: "CLIENTE EXEMPLO",
  num_cnpj_cpf: "12345678000195",
  des_email_1: "cliente@example.com",
  num_telefone_1: "(17) 3333-4444",
  nom_cidade: "SAO JOSE DO RIO PRETO",
  sgl_estado: "sp",
  dta_cadastro: "2026-01-15",
  ind_pessoa_ativa: "S",
  bloqueio_financeiro: "N",
  qtd_veiculos: 3,
  dta_ultima_compra: "2026-08-20",
  is_active_120d: true,
  source_hash: "ABC123",
  source_updated_at: null,
  synced_at: "2026-09-22T12:00:00Z",
  created_at: "2026-09-22T12:00:00Z",
  updated_at: "2026-09-22T12:00:00Z",
}

describe("client mapper", () => {
  it("normaliza o contrato ERP sem inferir os indicadores textuais", () => {
    expect(mapErpClient(validRecord)).toMatchObject({
      id: "123456789012345",
      name: "CLIENTE EXEMPLO LTDA",
      tradeName: "CLIENTE EXEMPLO",
      taxId: "12.345.678/0001-95",
      city: "SAO JOSE DO RIO PRETO",
      state: "São Paulo",
      stateCode: "SP",
      registeredAt: "2026-01-15",
      personActiveStatus: "S",
      financialBlockStatus: "N",
      vehicleCount: 3,
      lastPurchaseAt: "2026-08-20",
      activeWithin120Days: true,
    })
  })

  it("preserva campos textuais vazios aceitos pelo ERP", () => {
    expect(
      mapErpClient({
        ...validRecord,
        nom_fantasia: "",
        des_email_1: "",
        num_telefone_1: "",
      }),
    ).toMatchObject({
      tradeName: "",
      email: "",
      phone: "",
    })
  })

  it("formata CPF e CNPJ pela quantidade de dígitos", () => {
    expect(formatCpfCnpj("12345678901")).toBe("123.456.789-01")
    expect(formatCpfCnpj("12345678000195")).toBe("12.345.678/0001-95")
  })

  it("rejeita respostas e campos incompatíveis com o contrato", () => {
    expect(() => mapErpClients({})).toThrow("deve ser um array")
    expect(() => mapErpClient({ ...validRecord, qtd_veiculos: 1.5 })).toThrow(
      "qtd_veiculos",
    )
    expect(() =>
      mapErpClient({ ...validRecord, dta_cadastro: "2026-02-31" }),
    ).toThrow("dta_cadastro")
    expect(() => formatCpfCnpj("123")).toThrow("11 ou 14")
  })
})
