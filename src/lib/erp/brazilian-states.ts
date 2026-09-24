import { sanitizeErpText } from "@/lib/erp/erp-record"

export const BRAZILIAN_STATE_NAMES = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
} as const

export type BrazilianStateCode = keyof typeof BRAZILIAN_STATE_NAMES

export function parseBrazilianStateCode(value: string): BrazilianStateCode {
  const stateCode = sanitizeErpText(value).toLocaleUpperCase("pt-BR")

  if (!Object.hasOwn(BRAZILIAN_STATE_NAMES, stateCode)) {
    throw new TypeError(
      `Registro ERP inválido: ${stateCode || "UF vazia"} não é uma UF brasileira válida.`,
    )
  }

  return stateCode as BrazilianStateCode
}

export function getBrazilianStateName(stateCode: BrazilianStateCode) {
  return BRAZILIAN_STATE_NAMES[stateCode]
}
