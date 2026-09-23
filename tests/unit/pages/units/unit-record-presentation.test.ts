import { describe, expect, it } from "vitest"

import { unitErpFixture } from "@/pages/units/data/unit-erp.fixture"
import { mapErpUnits } from "@/pages/units/model/unit-mapper"
import { unitRecordSections } from "@/pages/units/model/unit-record-presentation"

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
})
