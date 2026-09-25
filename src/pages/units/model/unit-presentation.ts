import { sanitizeErpText } from "@/lib/erp/erp-record"

const EMPTY_DISPLAY = "—"

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const LOWERCASE_WORDS = new Set([
  "A",
  "AS",
  "COM",
  "DA",
  "DAS",
  "DE",
  "DO",
  "DOS",
  "E",
  "EM",
  "NA",
  "NAS",
  "NO",
  "NOS",
  "PARA",
  "POR",
])

const CORRECTED_WORDS = new Map([
  ["CONVENIENCIA", "Conveniência"],
  ["FENIX", "Fênix"],
  ["GOIANIA", "Goiânia"],
  ["JUNDIAI", "Jundiaí"],
  ["JOSE", "José"],
  ["MAQUINA", "Máquina"],
  ["MAQUINAS", "Máquinas"],
  ["NAO", "Não"],
  ["ORGANIZACAO", "Organização"],
  ["PARANAGUA", "Paranaguá"],
  ["PARTICIPACOES", "Participações"],
  ["RIBEIRAO", "Ribeirão"],
  ["SAO", "São"],
  ["VARZEA", "Várzea"],
])

const VERIFIED_CITY_NAMES = new Map([
  ["CAMPINAS", "Campinas"],
  ["CURITIBA", "Curitiba"],
  ["GOIANIA", "Goiânia"],
  ["LONDRINA", "Londrina"],
  ["RIBEIRAO PRETO", "Ribeirão Preto"],
  ["SAO JOSE DO RIO PRETO", "São José do Rio Preto"],
  ["SOROCABA", "Sorocaba"],
  ["UBERLANDIA", "Uberlândia"],
])

function capitalize(value: string) {
  return value.length === 0
    ? value
    : `${value.charAt(0).toLocaleUpperCase("pt-BR")}${value
        .slice(1)
        .toLocaleLowerCase("pt-BR")}`
}

function formatUppercaseWord(value: string, index: number) {
  const corrected = CORRECTED_WORDS.get(value)

  if (corrected) {
    return corrected
  }

  if (index > 0 && LOWERCASE_WORDS.has(value)) {
    return value.toLocaleLowerCase("pt-BR")
  }

  if (/^[A-Z0-9]{1,3}$/u.test(value)) {
    return value
  }

  if (value === "LTDA") {
    return "Ltda"
  }

  return capitalize(value)
}

export function formatUnitName(value: string) {
  const normalized = sanitizeErpText(value)

  if (!normalized) {
    return EMPTY_DISPLAY
  }

  if (normalized !== normalized.toLocaleUpperCase("pt-BR")) {
    return normalized
  }

  return normalized
    .split(" ")
    .map((word, index) =>
      word
        .split("-")
        .map((part) => formatUppercaseWord(part, index))
        .join("-"),
    )
    .join(" ")
}

export function formatUnitCity(value: string) {
  const normalized = sanitizeErpText(value)

  if (!normalized) {
    return EMPTY_DISPLAY
  }

  const upper = normalized.toLocaleUpperCase("pt-BR")
  return VERIFIED_CITY_NAMES.get(upper) ?? formatUnitName(normalized)
}

export function formatUnitDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

export function formatUnitOptionalText(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return EMPTY_DISPLAY
  }

  const normalized = sanitizeErpText(value)
  return normalized || EMPTY_DISPLAY
}
