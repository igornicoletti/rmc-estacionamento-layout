import type { Client } from "@/pages/clients/model/client"
import {
  formatCpfCnpj,
  readErpBoolean,
  readErpDate,
  readErpDateTime,
  readErpIdentifier,
  readErpInteger,
  readErpString,
  type ErpRecord,
} from "@/pages/clients/model/erp-record"

const BRAZILIAN_STATE_NAMES: Record<string, string> = {
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
}

export { formatCpfCnpj } from "@/pages/clients/model/erp-record"

export function mapLegacyClient(input: unknown): Client {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("Cliente inválido: registro deve ser um objeto.")
  }

  const record = input as ErpRecord
  const stateCode = readErpString(record, "sgl_estado").toLocaleUpperCase("pt-BR")

  return {
    id: readErpIdentifier(record, "cod_pessoa"),
    name: readErpString(record, "nom_pessoa"),
    tradeName: readErpString(record, "nom_fantasia", { allowEmpty: true }),
    taxId: formatCpfCnpj(readErpString(record, "num_cnpj_cpf")),
    email: readErpString(record, "des_email_1", { allowEmpty: true }),
    phone: readErpString(record, "num_telefone_1", { allowEmpty: true }),
    city: readErpString(record, "nom_cidade"),
    state: BRAZILIAN_STATE_NAMES[stateCode] ?? stateCode,
    stateCode,
    registeredAt: readErpDate(record, "dta_cadastro"),
    personActiveStatus: readErpString(record, "ind_pessoa_ativa"),
    financialBlockStatus: readErpString(record, "bloqueio_financeiro"),
    vehicleCount: readErpInteger(record, "qtd_veiculos"),
    lastPurchaseAt: readErpDate(record, "dta_ultima_compra"),
    activeWithin120Days: readErpBoolean(record, "is_active_120d"),
    sourceHash: readErpString(record, "source_hash"),
    sourceUpdatedAt: readErpDateTime(record, "source_updated_at", true),
    synchronizedAt: readErpDateTime(record, "synced_at") as string,
    createdAt: readErpDateTime(record, "created_at") as string,
    updatedAt: readErpDateTime(record, "updated_at") as string,
  }
}

export function mapLegacyClients(input: unknown): Client[] {
  if (!Array.isArray(input)) {
    throw new TypeError("Resposta inválida: a lista de clientes deve ser um array.")
  }

  return input.map(mapLegacyClient)
}
