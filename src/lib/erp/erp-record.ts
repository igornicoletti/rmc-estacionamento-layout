export type ErpRecord = Record<string, unknown>

export function asErpRecord(input: unknown, entityLabel: string): ErpRecord {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError(`${entityLabel} inválido: registro deve ser um objeto.`)
  }

  return input as ErpRecord
}

export function sanitizeErpText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

export function readErpString(
  record: ErpRecord,
  key: string,
  options: { allowEmpty?: boolean } = {},
) {
  const value = record[key]

  if (typeof value !== "string") {
    throw new TypeError(`Registro ERP inválido: ${key} deve ser texto.`)
  }

  const normalized = sanitizeErpText(value)

  if (!options.allowEmpty && normalized === "") {
    throw new TypeError(`Registro ERP inválido: ${key} não pode ser vazio.`)
  }

  return normalized
}

export function readErpNullableString(record: ErpRecord, key: string) {
  const value = record[key]

  if (value === null || value === undefined || value === "") {
    return null
  }

  if (typeof value !== "string") {
    throw new TypeError(
      `Registro ERP inválido: ${key} deve ser texto ou nulo.`,
    )
  }

  const normalized = sanitizeErpText(value)
  return normalized === "" ? null : normalized
}

export function readErpInteger(record: ErpRecord, key: string) {
  const value = record[key]

  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new TypeError(
      `Registro ERP inválido: ${key} deve ser um número inteiro.`,
    )
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

  if (typeof value === "string") {
    const normalized = sanitizeErpText(value)

    if (/^\d+$/u.test(normalized)) {
      return normalized
    }
  }

  throw new TypeError(
    `Registro ERP inválido: ${key} deve ser um identificador inteiro.`,
  )
}

export function readErpBoolean(record: ErpRecord, key: string) {
  const value = record[key]

  if (typeof value !== "boolean") {
    throw new TypeError(
      `Registro ERP inválido: ${key} deve ser booleano.`,
    )
  }

  return value
}
