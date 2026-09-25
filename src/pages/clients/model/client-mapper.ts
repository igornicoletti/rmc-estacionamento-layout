import {
  getBrazilianStateName,
  parseBrazilianStateCode,
} from "@/lib/erp/brazilian-states"
import {
  readErpDate,
  readErpDateTime,
} from "@/lib/erp/date-time"
import {
  asErpRecord,
  readErpBoolean,
  readErpIdentifier,
  readErpInteger,
  readErpString,
} from "@/lib/erp/erp-record"
import { formatCpfCnpj } from "@/lib/erp/tax-id"
import type { Client } from "@/pages/clients/model/client"

export function mapErpClient(input: unknown): Client {
  const record = asErpRecord(input, "Cliente")
  const stateCode = parseBrazilianStateCode(
    readErpString(record, "sgl_estado"),
  )

  return {
    id: readErpIdentifier(record, "cod_pessoa"),
    name: readErpString(record, "nom_pessoa"),
    tradeName: readErpString(record, "nom_fantasia", { allowEmpty: true }),
    taxId: formatCpfCnpj(readErpString(record, "num_cnpj_cpf")),
    email: readErpString(record, "des_email_1", { allowEmpty: true }),
    phone: readErpString(record, "num_telefone_1", { allowEmpty: true }),
    city: readErpString(record, "nom_cidade"),
    state: getBrazilianStateName(stateCode),
    stateCode,
    registeredAt: readErpDate(record, "dta_cadastro"),
    personActiveStatus: readErpString(record, "ind_pessoa_ativa"),
    financialBlockStatus: readErpString(record, "bloqueio_financeiro"),
    vehicleCount: readErpInteger(record, "qtd_veiculos"),
    lastPurchaseAt: readErpDate(record, "dta_ultima_compra"),
    activeWithin120Days: readErpBoolean(record, "is_active_120d"),
    synchronizedAt: readErpDateTime(record, "synced_at"),
    createdAt: readErpDateTime(record, "created_at"),
    updatedAt: readErpDateTime(record, "updated_at"),
  }
}

export function mapErpClients(input: unknown): Client[] {
  if (!Array.isArray(input)) {
    throw new TypeError("Resposta inválida: a lista de clientes deve ser um array.")
  }

  return input.map(mapErpClient)
}
