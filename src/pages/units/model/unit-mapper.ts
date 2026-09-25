import {
  getBrazilianStateName,
  parseBrazilianStateCode,
} from "@/lib/erp/brazilian-states"
import { readErpDateTime } from "@/lib/erp/date-time"
import {
  asErpRecord,
  readErpIdentifier,
  readErpInteger,
  readErpNullableString,
  readErpString,
} from "@/lib/erp/erp-record"
import { formatCnpj } from "@/lib/erp/tax-id"
import type { Unit } from "@/pages/units/model/unit"

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
  const stateCode = parseBrazilianStateCode(
    readErpString(record, "sgl_estado"),
  )

  return {
    id: readErpIdentifier(record, "cod_empresa"),
    legalName: readErpString(record, "nom_razao_social"),
    tradeName: readErpString(record, "nom_fantasia"),
    cnpj: formatCnpj(readErpString(record, "num_cnpj")),
    brandCode: readErpInteger(record, "cod_bandeira"),
    brand: readErpString(record, "des_bandeira"),
    cityCode: readErpInteger(record, "cod_cidade"),
    city: readErpString(record, "nom_cidade"),
    state: getBrazilianStateName(stateCode),
    stateCode,
    coordinates: normalizeCoordinates(
      readErpNullableString(record, "des_coordenada_empresa"),
    ),
    synchronizedAt: readErpDateTime(record, "synced_at"),
    createdAt: readErpDateTime(record, "created_at"),
    updatedAt: readErpDateTime(record, "updated_at"),
  }
}

export function mapErpUnits(input: unknown): Unit[] {
  if (!Array.isArray(input)) {
    throw new TypeError("Resposta inválida: a lista de unidades deve ser um array.")
  }

  return input.map(mapErpUnit)
}
