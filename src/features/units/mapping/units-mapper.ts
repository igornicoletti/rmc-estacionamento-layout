import { parseBrazilianStateCode } from "@/lib/erp/brazilian-states"
import {
  asErpRecord,
  readErpIdentifier,
  readErpNullableInteger,
  readErpNullableString,
  readErpOptionalText,
} from "@/lib/erp/erp-record"
import { formatCnpj } from "@/lib/erp/tax-id"
import type { Unit } from "@/features/units/contracts/units-types"

function normalizeCoordinates(value: string | null) {
  if (!value) {
    return null
  }

  const values = value.match(/-?\d+(?:\.\d+)?/gu)?.map(Number)

  if (!values || values.length !== 2) {
    return null
  }

  const [latitude, longitude] = values

  if (
    latitude === undefined ||
    longitude === undefined ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
}

export function mapErpUnit(input: unknown): Unit {
  const record = asErpRecord(input, "Unidade")
  const rawStateCode = readErpOptionalText(record, "sgl_estado")
  const stateCode = rawStateCode ? parseBrazilianStateCode(rawStateCode) : ""
  const taxId = readErpOptionalText(record, "num_cnpj")

  return {
    id: readErpIdentifier(record, "cod_empresa"),
    legalName: readErpOptionalText(record, "nom_razao_social"),
    tradeName: readErpOptionalText(record, "nom_fantasia"),
    cnpj: taxId ? formatCnpj(taxId) : "",
    brandCode: readErpNullableInteger(record, "cod_bandeira"),
    brand: readErpOptionalText(record, "des_bandeira"),
    cityCode: readErpNullableInteger(record, "cod_cidade"),
    city: readErpOptionalText(record, "nom_cidade"),
    state: readErpOptionalText(record, "nom_estado"),
    stateCode,
    coordinates: normalizeCoordinates(
      readErpNullableString(record, "des_coordenada_empresa"),
    ),
  }
}

export function mapErpUnits(input: unknown): Unit[] {
  if (!Array.isArray(input)) {
    throw new TypeError(
      "Resposta inválida: a lista de unidades deve ser um array.",
    )
  }

  return input.map(mapErpUnit)
}
