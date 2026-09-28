import {
  createRecordCsvColumns,
  type RecordSectionDefinition,
} from "@/lib/format-record-fields"
import type { Unit } from "@/features/units/contracts/units-types"
import {
  formatUnitCity,
  formatUnitDateTime,
  formatUnitName,
} from "@/features/units/presentation/units-format"

export const unitRecordSections = [
  {
    key: "identification",
    title: "Identificação",
    fields: [
      { key: "id", label: "Código", getValue: (unit) => unit.id },
      {
        key: "tradeName",
        label: "Nome fantasia",
        getValue: (unit) => formatUnitName(unit.tradeName),
      },
      {
        key: "legalName",
        label: "Razão social",
        getValue: (unit) => formatUnitName(unit.legalName),
      },
      { key: "cnpj", label: "CNPJ", getValue: (unit) => unit.cnpj },
      {
        key: "brand",
        label: "Bandeira",
        getValue: (unit) => formatUnitName(unit.brand),
      },
      {
        key: "brandCode",
        label: "Código da bandeira",
        getValue: (unit) => unit.brandCode,
      },
    ],
  },
  {
    key: "location",
    title: "Localização",
    fields: [
      {
        key: "city",
        label: "Cidade",
        getValue: (unit) => formatUnitCity(unit.city),
      },
      {
        key: "cityCode",
        label: "Código da cidade",
        getValue: (unit) => unit.cityCode,
      },
      { key: "state", label: "Estado", getValue: (unit) => unit.state },
      { key: "stateCode", label: "UF", getValue: (unit) => unit.stateCode },
      {
        key: "coordinates",
        label: "Coordenadas",
        getValue: (unit) => unit.coordinates,
      },
    ],
  },
  {
    key: "system",
    title: "Sistema",
    fields: [
      {
        key: "synchronizedAt",
        label: "Sincronização",
        getValue: (unit) => formatUnitDateTime(unit.synchronizedAt),
      },
      {
        key: "createdAt",
        label: "Criação",
        getValue: (unit) => formatUnitDateTime(unit.createdAt),
      },
      {
        key: "updatedAt",
        label: "Atualização",
        getValue: (unit) => formatUnitDateTime(unit.updatedAt),
      },
    ],
  },
] satisfies readonly RecordSectionDefinition<Unit>[]

export const unitRecordCsvColumns = createRecordCsvColumns(unitRecordSections)
