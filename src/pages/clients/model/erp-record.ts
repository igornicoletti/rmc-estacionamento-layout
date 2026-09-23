export type ErpRecord = Record<string, unknown>

export function readErpString(
  record: ErpRecord,
  key: string,
  options: { allowEmpty?: boolean } = {},
) {
  const value = record[key]

  if (typeof value !== "string") {
    throw new TypeError(`Registro ERP inválido: ${key} deve ser texto.`)
  }

  const normalized = value.trim()

  if (!options.allowEmpty && normalized === "") {
    throw new TypeError(`Registro ERP inválido: ${key} não pode ser vazio.`)
  }

  return normalized
}

export function readErpInteger(record: ErpRecord, key: string) {
  const value = record[key]

  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new TypeError(`Registro ERP inválido: ${key} deve ser um número inteiro.`)
  }

  return value
}

export function readErpIdentifier(record: ErpRecord, key: string) {
  const value = record[key]

  if (typeof value === "bigint") {
    return value.toString()
  }

  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return String(value)
  }

  if (typeof value === "string" && /^\d+$/u.test(value.trim())) {
    return value.trim()
  }

  throw new TypeError(`Registro ERP inválido: ${key} deve ser um identificador inteiro.`)
}

export function readErpBoolean(record: ErpRecord, key: string) {
  const value = record[key]

  if (typeof value !== "boolean") {
    throw new TypeError(`Registro ERP inválido: ${key} deve ser booleano.`)
  }

  return value
}

export function readErpDate(record: ErpRecord, key: string) {
  const value = record[key]

  if (value === null || value === undefined || value === "") {
    return null
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new TypeError(`Registro ERP inválido: ${key} deve ser uma data ISO válida.`)
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new TypeError(`Registro ERP inválido: ${key} deve ser uma data ISO válida.`)
  }

  return value
}

export function readErpDateTime(
  record: ErpRecord,
  key: string,
  nullable = false,
) {
  const value = record[key]

  if (nullable && (value === null || value === undefined || value === "")) {
    return null
  }

  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`Registro ERP inválido: ${key} deve ser uma data ISO válida.`)
  }

  return new Date(value).toISOString()
}

export function formatCpfCnpj(value: string) {
  const digits = value.replace(/\D/gu, "")

  if (digits.length === 11) {
    return digits.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/u,
      "$1.$2.$3-$4",
    )
  }

  if (digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/u,
      "$1.$2.$3/$4-$5",
    )
  }

  throw new TypeError(
    "Registro ERP inválido: num_cnpj_cpf deve conter 11 ou 14 dígitos.",
  )
}
