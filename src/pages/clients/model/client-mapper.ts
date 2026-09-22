import type { Client } from "@/pages/clients/model/client"

type LegacyRecord = Record<string, unknown>

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

function requiredString(record: LegacyRecord, key: string) {
  const value = record[key]
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`Cliente inválido: ${key} deve ser um texto preenchido.`)
  }
  return value.trim()
}

function requiredInteger(record: LegacyRecord, key: string) {
  const value = record[key]
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new TypeError(`Cliente inválido: ${key} deve ser um número inteiro.`)
  }
  return value
}

function requiredBoolean(record: LegacyRecord, key: string) {
  const value = record[key]
  if (typeof value !== "boolean") {
    throw new TypeError(`Cliente inválido: ${key} deve ser booleano.`)
  }
  return value
}

function requiredIdentifier(record: LegacyRecord, key: string) {
  const value = record[key]

  if (typeof value === "bigint") {
    return value.toString()
  }

  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return String(value)
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return value.trim()
  }

  throw new TypeError(`Cliente inválido: ${key} deve ser um identificador inteiro.`)
}

function normalizeDate(value: unknown, key: string) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`Cliente inválido: ${key} deve ser uma data ISO válida.`)
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`Cliente inválido: ${key} deve ser uma data ISO válida.`)
  }

  return value
}

function normalizeDateTime(value: unknown, key: string, nullable = false) {
  if (nullable && (value === null || value === undefined || value === "")) {
    return null
  }

  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`Cliente inválido: ${key} deve ser uma data ISO válida.`)
  }

  return new Date(value).toISOString()
}

export function formatCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, "")

  if (digits.length === 11) {
    return digits.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      "$1.$2.$3-$4",
    )
  }

  if (digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    )
  }

  throw new TypeError(
    "Cliente inválido: num_cnpj_cpf deve conter 11 ou 14 dígitos.",
  )
}

export function mapLegacyClient(input: unknown): Client {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("Cliente inválido: registro deve ser um objeto.")
  }

  const record = input as LegacyRecord
  const stateCode = requiredString(record, "sgl_estado").toLocaleUpperCase("pt-BR")

  return {
    id: requiredIdentifier(record, "cod_pessoa"),
    name: requiredString(record, "nom_pessoa"),
    tradeName: requiredString(record, "nom_fantasia"),
    taxId: formatCpfCnpj(requiredString(record, "num_cnpj_cpf")),
    email: requiredString(record, "des_email_1"),
    phone: requiredString(record, "num_telefone_1"),
    city: requiredString(record, "nom_cidade"),
    state: BRAZILIAN_STATE_NAMES[stateCode] ?? stateCode,
    stateCode,
    registeredAt: normalizeDate(record.dta_cadastro, "dta_cadastro"),
    personActiveStatus: requiredString(record, "ind_pessoa_ativa"),
    financialBlockStatus: requiredString(record, "bloqueio_financeiro"),
    vehicleCount: requiredInteger(record, "qtd_veiculos"),
    lastPurchaseAt: normalizeDate(record.dta_ultima_compra, "dta_ultima_compra"),
    activeWithin120Days: requiredBoolean(record, "is_active_120d"),
    sourceHash: requiredString(record, "source_hash").toLocaleLowerCase("pt-BR"),
    sourceUpdatedAt: normalizeDateTime(
      record.source_updated_at,
      "source_updated_at",
      true,
    ),
    synchronizedAt: normalizeDateTime(record.synced_at, "synced_at") as string,
    createdAt: normalizeDateTime(record.created_at, "created_at") as string,
    updatedAt: normalizeDateTime(record.updated_at, "updated_at") as string,
  }
}

export function mapLegacyClients(input: unknown): Client[] {
  if (!Array.isArray(input)) {
    throw new TypeError("Resposta inválida: a lista de clientes deve ser um array.")
  }

  return input.map(mapLegacyClient)
}
