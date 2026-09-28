import type { ErpClient } from "@/features/clients/contracts/clients-erp-types"
import { createMockCnpj } from "@/mocks/mock-tax-id"

const CITIES = [
  ["SAO JOSE DO RIO PRETO", "SP"],
  ["RIBEIRAO PRETO", "SP"],
  ["UBERLANDIA", "MG"],
  ["CURITIBA", "PR"],
] as const

export const clientErpFixture: unknown = Array.from(
  { length: 24 },
  (_, index) => {
    const clientId = 1001 + index
    const [city, stateCode] = CITIES[index % CITIES.length]

    return {
      cod_pessoa: clientId,
      nom_pessoa: `CLIENTE DEMONSTRACAO ${String(index + 1).padStart(2, "0")} LTDA`,
      nom_fantasia: `CLIENTE ${String(index + 1).padStart(2, "0")}`,
      num_cnpj_cpf: createMockCnpj(index),
      des_email_1:
        index === 0
          ? "cliente1@example.invalid;financeiro@example.invalid;frota@example.invalid"
          : `cliente${index + 1}@example.invalid`,
      num_telefone_1: `1799000${String(index + 1).padStart(4, "0")}`,
      nom_cidade: city,
      sgl_estado: stateCode,
      dta_cadastro: `2026-${String((index % 8) + 1).padStart(2, "0")}-15`,
      ind_pessoa_ativa: index % 5 === 0 ? "N" : "S",
      bloqueio_financeiro: index % 7 === 0 ? "S" : "N",
      qtd_veiculos: 2,
      dta_ultima_compra: index % 6 === 0 ? null : "2026-08-20",
    } satisfies ErpClient
  },
)
