import { describe, expect, it } from "vitest"

import { serializeRecordForClipboard } from "@/lib/records/records-fields"
import { unitErpFixture } from "@/mocks/mock-units-fixtures"
import { mapErpUnits } from "@/features/units/mapping/units-mapper"
import {
  unitRecordCsvColumns,
  unitRecordSections,
} from "@/features/units/presentation/units-record"

describe("unitRecordSections", () => {
  it("mantém todos os campos da unidade no contrato de apresentação", () => {
    const unit = mapErpUnits(unitErpFixture).at(0)

    if (!unit) {
      throw new Error("Fixture de unidade vazia.")
    }

    const sectionKeys: string[] = []

    for (const section of unitRecordSections) {
      for (const field of section.fields) {
        sectionKeys.push(field.key)
      }
    }

    expect(sectionKeys.sort()).toEqual(Object.keys(unit).sort())
  })

  it("preserva o valor canônico no modelo e formata cópia e CSV", () => {
    const unit = mapErpUnits(unitErpFixture).at(0)

    if (!unit) {
      throw new Error("Fixture de unidade vazia.")
    }

    expect(unit.legalName).toBe("POSTO MONTE CARLO IGUATEMI LTDA")
    expect(unit.tradeName).toBe("IGUATEMI")

    const legalNameField = unitRecordSections
      .find((section) => section.key === "identification")
      ?.fields.find((field) => field.key === "legalName")

    expect(legalNameField?.getValue(unit)).toBe(
      "Posto Monte Carlo Iguatemi Ltda",
    )
    expect(serializeRecordForClipboard(unit, unitRecordSections)).toContain(
      "Razão social: Posto Monte Carlo Iguatemi Ltda",
    )

    const legalNameColumn = unitRecordCsvColumns.find(
      (column) => column.header === "Razão social",
    )

    expect(legalNameColumn?.getValue(unit)).toBe(
      "Posto Monte Carlo Iguatemi Ltda",
    )
  })

  it("apresenta Paraná e Paranaguá corretamente a partir do espelho", () => {
    const goiasUnit = mapErpUnits(unitErpFixture).find(
      (unit) => unit.city === "PARANAGUA",
    )

    if (!goiasUnit) {
      throw new Error("Fixture não contém unidade de Paranaguá.")
    }

    const cityField = unitRecordSections
      .find((section) => section.key === "location")
      ?.fields.find((field) => field.key === "city")

    expect(goiasUnit.state).toBe("PARANA")
    const stateField = unitRecordSections
      .find((section) => section.key === "location")
      ?.fields.find((field) => field.key === "state")
    expect(stateField?.getValue(goiasUnit)).toBe("Paraná")
    expect(cityField?.getValue(goiasUnit)).toBe("Paranaguá")
  })
})
