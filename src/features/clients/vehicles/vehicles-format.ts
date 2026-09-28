import { sanitizeErpText } from "@/lib/erp/erp-record"
import { formatErpName } from "@/features/clients/clients-format"

const EMPTY_DISPLAY = "—"

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
