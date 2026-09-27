import { describe, expect, it } from "vitest"

import { serializeRecordForClipboard } from "@/lib/format-record-fields"
import { unitErpFixture } from "@/pages/units/data/unit-erp.fixture"
import { mapErpUnits } from "@/pages/units/model/unit-mapper"
import {
  unitRecordCsvColumns,
  unitRecordSections,
} from "@/pages/units/model/unit-record-presentation"

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

    expect(unit.legalName).toBe("UNIDADE DEMONSTRACAO 01 LTDA")
    expect(unit.tradeName).toBe("UNIDADE 01")

    const legalNameField = unitRecordSections
      .find((section) => section.key === "identification")
      ?.fields.find((field) => field.key === "legalName")

    expect(legalNameField?.getValue(unit)).toBe(
      "Unidade Demonstracao 01 Ltda",
    )
    expect(
      serializeRecordForClipboard(unit, unitRecordSections),
    ).toContain("Razão social: Unidade Demonstracao 01 Ltda")

    const legalNameColumn = unitRecordCsvColumns.find(
      (column) => column.header === "Razão social",
    )

    expect(legalNameColumn?.getValue(unit)).toBe(
      "Unidade Demonstracao 01 Ltda",
    )
  })

  it("apresenta Goiás e Goiânia corretamente a partir do fixture", () => {
    const goiasUnit = mapErpUnits(unitErpFixture).find(
      (unit) => unit.stateCode === "GO",
    )

    if (!goiasUnit) {
      throw new Error("Fixture não contém unidade de Goiás.")
    }

    const cityField = unitRecordSections
      .find((section) => section.key === "location")
      ?.fields.find((field) => field.key === "city")

    expect(goiasUnit.state).toBe("Goiás")
    expect(cityField?.getValue(goiasUnit)).toBe("Goiânia")
  })
})
