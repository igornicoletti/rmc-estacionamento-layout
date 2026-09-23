const EMPTY_DISPLAY = "—"

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
})

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const VERIFIED_ACRONYMS = new Set(["HU", "REP", "RO", "RPS", "RS"])

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
  ["ASSOCIACAO", "Associação"],
  ["BIGUACU", "Biguaçu"],
  ["CESAR", "César"],
  ["JAU", "Jaú"],
  ["JOSE", "José"],
  ["LOGISTICA", "Logística"],
  ["LOGISTICO", "Logístico"],
  ["MARINGA", "Maringá"],
  ["PAULINIA", "Paulínia"],
  ["RIBEIRAO", "Ribeirão"],
  ["RODOVIARIO", "Rodoviário"],
  ["RONDONOPOLIS", "Rondonópolis"],
  ["SAO", "São"],
])

const VERIFIED_CITY_NAMES = new Map([
  ["APARECIDA DO TABOADO", "Aparecida do Taboado"],
  ["BIGUACU", "Biguaçu"],
  ["CAMPO GRANDE", "Campo Grande"],
  ["COLOMBO", "Colombo"],
  ["GUARAREMA", "Guararema"],
  ["ITURAMA", "Iturama"],
  ["ITUVERAVA", "Ituverava"],
  ["JAU", "Jaú"],
  ["MARINGA", "Maringá"],
  ["MERIDIANO", "Meridiano"],
  ["PAULINIA", "Paulínia"],
  ["RIBEIRAO PRETO", "Ribeirão Preto"],
  ["RONDONOPOLIS", "Rondonópolis"],
  ["SANTA FE DO SUL", "Santa Fé do Sul"],
  ["SANTA MARIA DO HERVAL", "Santa Maria do Herval"],
  ["SANTOS", "Santos"],
  ["SAO JOSE DO RIO PRETO", "São José do Rio Preto"],
  ["SARANDI", "Sarandi"],
  ["VESPASIANO", "Vespasiano"],
  ["VILHENA", "Vilhena"],
])

const VEHICLE_DESCRIPTION_NAMES = new Map([
  ["ACTROS", "Actros"],
  ["ATEGO", "Atego"],
  ["CHEVROLET", "Chevrolet"],
  ["DAF", "DAF"],
  ["FIAT", "Fiat"],
  ["HONDA", "Honda"],
  ["MERCEDES", "Mercedes"],
  ["MERCEDEZ", "Mercedes"],
  ["PLACA", "Placa"],
  ["SCANIA", "Scania"],
  ["VEICULO", "Veículo"],
  ["VOLKSWAGEN", "Volkswagen"],
  ["VOLVO", "Volvo"],
])

function sanitizeErpText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

function capitalize(value: string) {
  return value.length === 0
    ? value
    : `${value[0].toLocaleUpperCase("pt-BR")}${value
        .slice(1)
        .toLocaleLowerCase("pt-BR")}`
}

function formatWord(value: string, index: number) {
  const upper = value.toLocaleUpperCase("pt-BR")

  if (upper === "LTDA") {
    return "Ltda"
  }

  if (upper === "CIA") {
    return "Cia"
  }

  const corrected = CORRECTED_WORDS.get(upper)
  if (corrected) {
    return corrected
  }

  if (index > 0 && LOWERCASE_WORDS.has(upper)) {
    return upper.toLocaleLowerCase("pt-BR")
  }

  if (
    VERIFIED_ACRONYMS.has(upper) ||
    (value === upper && (/^[A-Z]$/u.test(upper) || /^\d+[A-Z]+$/u.test(upper)))
  ) {
    return upper
  }

  return capitalize(value)
}

export function formatDate(value: string | null) {
  return value
    ? dateFormatter.format(new Date(`${value}T00:00:00.000Z`))
    : EMPTY_DISPLAY
}

export function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : EMPTY_DISPLAY
}

export function formatErpName(value: string) {
  const normalized = sanitizeErpText(value)

  if (!normalized) {
    return EMPTY_DISPLAY
  }

  return normalized
    .split(" ")
    .map((word, index) => {
      if (word === "-") {
        return word
      }

      return word
        .split("-")
        .map((part) => formatWord(part, index))
        .join("-")
    })
    .join(" ")
}

export function formatCityName(value: string) {
  const normalized = sanitizeErpText(value)

  if (!normalized) {
    return EMPTY_DISPLAY
  }

  const upper = normalized.toLocaleUpperCase("pt-BR")
  return VERIFIED_CITY_NAMES.get(upper) ?? formatErpName(normalized)
}

export function formatVehicleDescription(value: string) {
  const normalized = sanitizeErpText(value)

  if (!normalized) {
    return EMPTY_DISPLAY
  }

  const upper = normalized.toLocaleUpperCase("pt-BR")

  if (
    /^[A-Z]{3}\d[A-Z0-9]\d{2}$/u.test(upper) ||
    /^[A-Z]{3}\d{4}$/u.test(upper)
  ) {
    return upper
  }

  return VEHICLE_DESCRIPTION_NAMES.get(upper) ?? formatErpName(normalized)
}

export function formatOptionalText(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return EMPTY_DISPLAY
  }

  const normalized = sanitizeErpText(value)
  return normalized || EMPTY_DISPLAY
}

export function formatPhone(value: string) {
  const normalized = sanitizeErpText(value)

  if (!normalized) {
    return EMPTY_DISPLAY
  }

  const digits = normalized.replace(/\D/gu, "")

  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/u, "($1) $2-$3")
  }

  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/u, "($1) $2-$3")
  }

  return normalized
}

export function formatLicensePlate(value: string) {
  const normalized = sanitizeErpText(value).toLocaleUpperCase("pt-BR")

  if (!normalized) {
    return EMPTY_DISPLAY
  }

  const compact = normalized.replace(/[\s-]/gu, "")

  if (/^[A-Z]{3}\d{4}$/u.test(compact)) {
    return `${compact.slice(0, 3)}-${compact.slice(3)}`
  }

  if (/^[A-Z]{3}\d[A-Z]\d{2}$/u.test(compact)) {
    return compact
  }

  return normalized
}

export function formatYesNo(value: string | boolean) {
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não"
  }

  const normalized = sanitizeErpText(value).toLocaleUpperCase("pt-BR")

  if (normalized === "S") {
    return "Sim"
  }

  if (normalized === "N") {
    return "Não"
  }

  return formatOptionalText(value)
}

export function splitEmails(value: string) {
  const normalized = sanitizeErpText(value)

  if (!normalized) {
    return []
  }

  return normalized
    .split(/[;,]/u)
    .map((email) => sanitizeErpText(email))
    .filter(Boolean)
}
