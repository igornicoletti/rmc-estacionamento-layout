import type { ErpRecord } from "@/lib/erp/erp-record"

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u
const ERP_DATE_TIME_PATTERN =
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d{1,6})?(Z|[+-]\d{2}(?::?\d{2})?)$/u

function isValidIsoDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

function normalizeFraction(value: string) {
  if (!value) {
    return ".000"
  }

  return `.${value.slice(1).padEnd(3, "0").slice(0, 3)}`
}

function normalizeOffset(value: string) {
  if (value === "Z") {
    return value
  }

  if (/^[+-]\d{2}$/u.test(value)) {
    return `${value}:00`
  }

  if (/^[+-]\d{4}$/u.test(value)) {
    return `${value.slice(0, 3)}:${value.slice(3)}`
  }

  return value
}

function normalizeErpDateTime(value: string) {
  const match = ERP_DATE_TIME_PATTERN.exec(value)

  if (!match) {
    return null
  }

  const [, date, time, fraction = "", rawOffset] = match

  if (!date || !time || !rawOffset || !isValidIsoDate(date)) {
    return null
  }

  const normalized =
    `${date}T${time}${normalizeFraction(fraction)}${normalizeOffset(rawOffset)}`
  const timestamp = Date.parse(normalized)

  return Number.isNaN(timestamp)
    ? null
    : new Date(timestamp).toISOString()
}

export function readErpDate(record: ErpRecord, key: string) {
  const value = record[key]

  if (value === null || value === undefined || value === "") {
    return null
  }

  if (typeof value !== "string" || !isValidIsoDate(value)) {
    throw new TypeError(
      `Registro ERP inválido: ${key} deve ser uma data ISO válida.`,
    )
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

  if (typeof value !== "string") {
    throw new TypeError(
      `Registro ERP inválido: ${key} deve ser uma data/hora ISO com fuso horário.`,
    )
  }

  const normalized = normalizeErpDateTime(value.trim())

  if (!normalized) {
    throw new TypeError(
      `Registro ERP inválido: ${key} deve ser uma data/hora ISO com fuso horário.`,
    )
  }

  return normalized
}
