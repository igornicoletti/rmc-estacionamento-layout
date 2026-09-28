import { unitCityNames } from "@/features/units/presentation/units-city-names"
import { sanitizeErpText } from "@/lib/erp/erp-record"

const EMPTY_DISPLAY = "—"

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
  ["ACU", "Açu"],
  ["AGUAPEI", "Aguapeí"],
  ["CANDIDO", "Cândido"],
  ["CUIABA", "Cuiabá"],
  ["FE", "Fé"],
  ["SANTOPOLIS", "Santópolis"],
  ["CONVENIENCIA", "Conveniência"],
  ["FENIX", "Fênix"],
  ["GOIANIA", "Goiânia"],
  ["GOIAS", "Goiás"],
  ["PARANA", "Paraná"],
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
  ...unitCityNames,
  ["GOIANIA", "Goi\u00e2nia"],
  ["CURITIBA", "Curitiba"],
  ["CAMPINAS", "Campinas"],
  ["SOROCABA", "Sorocaba"],
  ["LONDRINA", "Londrina"],
])

function capitalize(value: string) {
  return value.length === 0
    ? value
    : `${value.charAt(0).toLocaleUpperCase("pt-BR")}${value
        .slice(1)
        .toLocaleLowerCase("pt-BR")}`
}

const PRESERVED_WORDS = new Set([
  "BR",
  "JK",
  "MC",
  "PV",
  "PQ.",
  "KM",
  "S/A",
  "S.A.",
])

function formatUppercaseWord(value: string, index: number) {
  value = value.toLocaleUpperCase("pt-BR")
  const corrected = CORRECTED_WORDS.get(value) ?? unitCityNames.get(value)

  if (corrected) {
    return corrected
  }

  if (index > 0 && LOWERCASE_WORDS.has(value)) {
    return value.toLocaleLowerCase("pt-BR")
  }

  if (
    PRESERVED_WORDS.has(value) ||
    /^(?:\d+[A-Z]+|BR\d+|KM\d+|\d+)$/u.test(value)
  ) {
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

export function formatUnitOptionalText(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return EMPTY_DISPLAY
  }

  const normalized = sanitizeErpText(value)
  return normalized || EMPTY_DISPLAY
}
