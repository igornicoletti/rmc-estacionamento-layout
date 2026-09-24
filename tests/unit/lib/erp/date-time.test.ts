import { describe, expect, it } from "vitest"

import {
  readErpDate,
  readErpDateTime,
} from "@/lib/erp/date-time"

describe("ERP date/time readers", () => {
  it("normaliza ISO e timestamps PostgreSQL com fuso explícito", () => {
    expect(
      readErpDateTime(
        { value: "2026-09-22T12:00:00Z" },
        "value",
      ),
    ).toBe("2026-09-22T12:00:00.000Z")

    expect(
      readErpDateTime(
        { value: "2026-08-01 07:57:45.009+00" },
        "value",
      ),
    ).toBe("2026-08-01T07:57:45.009Z")
  })

  it("rejeita datas impossíveis e date-times sem fuso", () => {
    expect(() =>
      readErpDate({ value: "2026-02-31" }, "value"),
    ).toThrow("data ISO válida")
    expect(() =>
      readErpDateTime(
        { value: "2026-09-22T12:00:00" },
        "value",
      ),
    ).toThrow("com fuso horário")
  })
})
