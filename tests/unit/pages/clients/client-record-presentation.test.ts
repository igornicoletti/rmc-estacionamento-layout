import { describe, expect, it } from "vitest"

import { clientErpFixture } from "@/pages/clients/data/client-erp.fixture"
import { mapErpClients } from "@/pages/clients/model/client-mapper"
import { clientRecordSections } from "@/pages/clients/model/client-record-presentation"

describe("clientRecordSections", () => {
  it("mantém todos os campos do cliente no contrato de apresentação", () => {
    const client = mapErpClients(clientErpFixture).at(0)

    if (!client) {
      throw new Error("Fixture de cliente vazia.")
    }

    const sectionKeys = clientRecordSections
      .flatMap((section) => section.fields)
      .map((field) => field.key)
      .sort()

    expect(sectionKeys).toEqual(Object.keys(client).sort())
  })
})
