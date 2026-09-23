import type { Unit } from "@/pages/units/model/unit"

type ErpUnitRecord = Record<string, unknown>

const STATE_NAMES: Record<string, string> = {
  MG: "Minas Gerais",
  MT: "Mato Grosso",
  PR: "Paraná",
  SC: "Santa Catarina",
  SP: "São Paulo",
}

const WORD_OVERRIDES: Record<string, string> = {
  acu: "Açu",
  br: "BR",
  conveniencia: "Conveniência",
  fenix: "Fênix",
  guara: "Guará",
  jundiai: "Jundiaí",
  jose: "José",
  ltda: "Ltda.",
  maquina: "Máquina",
  maquinas: "Máquinas",
  nao: "Não",
  organizacao: "Organização",
  paranagua: "Paranaguá",
  participacoes: "Participações",
  ribeirao: "Ribeirão",
  rubineia: "Rubineia",
  sao: "São",
  santopolis: "Santópolis",
  urania: "Urânia",
  varzea: "Várzea",
}

const LOWERCASE_CONNECTORS = new Set(["da", "de", "do", "e"])
const UPPERCASE_IDENTIFIERS = new Set(["BR", "BR-376", "JK", "PV"])

function requiredString(record: ErpUnitRecord, key: string) {
  const value = record[key]
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`Unidade inválida: ${key} deve ser um texto preenchido.`)
  }
  return value.trim()
}

function optionalString(record: ErpUnitRecord, key: string) {
  const value = record[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function requiredInteger(record: ErpUnitRecord, key: string) {
  const value = record[key]
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new TypeError(`Unidade inválida: ${key} deve ser um número inteiro.`)
  }
  return value
}

function normalizeWord(word: string, index: number) {
  if (UPPERCASE_IDENTIFIERS.has(word.toLocaleUpperCase("pt-BR"))) {
    return word.toLocaleUpperCase("pt-BR")
  }
  const normalized = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  const override = WORD_OVERRIDES[normalized]
  if (override) return override
  if (index > 0 && LOWERCASE_CONNECTORS.has(normalized)) return normalized
  return `${normalized.charAt(0).toLocaleUpperCase("pt-BR")}${normalized.slice(1)}`
}

export function normalizePortugueseName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(normalizeWord)
    .join(" ")
}

export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.length !== 14) {
    throw new TypeError("Unidade inválida: num_cnpj deve conter 14 dígitos.")
  }
  const calculateDigit = (base: string, weights: readonly number[]) => {
    const sum = weights.reduce(
      (total, weight, index) => total + Number(base[index]) * weight,
      0,
    )
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  const firstDigit = calculateDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const secondDigit = calculateDigit(`${digits.slice(0, 12)}${firstDigit}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  if (/^(\d)\1{13}$/.test(digits) || digits.slice(-2) !== `${firstDigit}${secondDigit}`) {
    throw new TypeError("Unidade inválida: num_cnpj não passou na validação.")
  }
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
}

function normalizeDateTime(value: unknown, key: string, nullable = false) {
  if (nullable && (value === null || value === undefined || value === "")) return null
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`Unidade inválida: ${key} deve ser uma data ISO válida.`)
  }
  return new Date(value).toISOString()
}

function normalizeCoordinates(value: string | null) {
  if (!value) return null
  const values = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number)
  if (!values || values.length !== 2) return null
  const [latitude, longitude] = values
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
}

export function mapErpUnit(input: unknown): Unit {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("Unidade inválida: registro deve ser um objeto.")
  }

  const record = input as ErpUnitRecord
  const stateCode = requiredString(record, "sgl_estado").toLocaleUpperCase("pt-BR")
  const rawState = requiredString(record, "nom_estado")

  return {
    id: String(requiredInteger(record, "cod_empresa")),
    legalName: normalizePortugueseName(requiredString(record, "nom_razao_social")),
    tradeName: normalizePortugueseName(requiredString(record, "nom_fantasia")),
    cnpj: formatCnpj(requiredString(record, "num_cnpj")),
    brandCode: requiredInteger(record, "cod_bandeira"),
    brand: normalizePortugueseName(requiredString(record, "des_bandeira")),
    cityCode: requiredInteger(record, "cod_cidade"),
    city: normalizePortugueseName(requiredString(record, "nom_cidade")),
    state: STATE_NAMES[stateCode] ?? normalizePortugueseName(rawState),
    stateCode,
    coordinates: normalizeCoordinates(optionalString(record, "des_coordenada_empresa")),
    synchronizedAt: normalizeDateTime(record.synced_at, "synced_at") as string,
    createdAt: normalizeDateTime(record.created_at, "created_at") as string,
    updatedAt: normalizeDateTime(record.updated_at, "updated_at") as string,
  }
}

export function mapErpUnits(input: unknown): Unit[] {
  if (!Array.isArray(input)) {
    throw new TypeError("Resposta inválida: a lista de unidades deve ser um array.")
  }
  return input.map(mapErpUnit)
}
