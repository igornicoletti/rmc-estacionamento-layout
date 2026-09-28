import {
  getBrazilianStateName,
  parseBrazilianStateCode,
} from "@/lib/erp/brazilian-states"
import { readErpDate } from "@/lib/erp/date-time"
import {
  asErpRecord,
  readErpIdentifier,
  readErpNullableInteger,
  readErpOptionalText,
} from "@/lib/erp/erp-record"
import { formatCpfCnpj } from "@/lib/erp/tax-id"
import type { Client } from "@/features/clients/contracts/clients-types"

export function mapErpClient(input: unknown): Client {
  const record = asErpRecord(input, "Cliente")
  const rawStateCode = readErpOptionalText(record, "sgl_estado")
  const stateCode = rawStateCode ? parseBrazilianStateCode(rawStateCode) : ""
  const taxId = readErpOptionalText(record, "num_cnpj_cpf")

  return {
    id: readErpIdentifier(record, "cod_pessoa"),
    name: readErpOptionalText(record, "nom_pessoa"),
    tradeName: readErpOptionalText(record, "nom_fantasia"),
    taxId: taxId ? formatCpfCnpj(taxId) : "",
    email: readErpOptionalText(record, "des_email_1"),
    phone: readErpOptionalText(record, "num_telefone_1"),
    city: readErpOptionalText(record, "nom_cidade"),
    state: stateCode
      ? getBrazilianStateName(parseBrazilianStateCode(stateCode))
      : "",
    stateCode,
    registeredAt: readErpDate(record, "dta_cadastro"),
    personActiveStatus: readErpOptionalText(record, "ind_pessoa_ativa"),
    financialBlockStatus: readErpOptionalText(record, "bloqueio_financeiro"),
    vehicleCount: readErpNullableInteger(record, "qtd_veiculos"),
    lastPurchaseAt: readErpDate(record, "dta_ultima_compra"),
  }
}

export function mapErpClients(input: unknown): Client[] {
  if (!Array.isArray(input)) {
    throw new TypeError(
      "Resposta inválida: a lista de clientes deve ser um array.",
    )
  }

  return input.map(mapErpClient)
}
