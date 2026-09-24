import { describe, expect, it } from "vitest"

import {
  asErpRecord,
  readErpIdentifier,
  readErpInteger,
  readErpNullableString,
  readErpString,
} from "@/lib/erp/erp-record"

describe("ERP record readers", () => {
  it("sanitiza apenas espaços e caracteres de controle", () => {
    const record = asErpRecord(
      { name: "  Razão\u0000   Social  " },
      "Registro",
    )

    expect(readErpString(record, "name")).toBe("Razão Social")
  })

  it("unifica identificadores inteiros em string", () => {
    expect(readErpIdentifier({ id: 42 }, "id")).toBe("42")
    expect(readErpIdentifier({ id: 42n }, "id")).toBe("42")
    expect(readErpIdentifier({ id: " 42 " }, "id")).toBe("42")
  })

  it("distingue inteiro obrigatório de texto opcional", () => {
    expect(readErpInteger({ code: 7 }, "code")).toBe(7)
    expect(readErpNullableString({ value: "" }, "value")).toBeNull()
    expect(readErpNullableString({ value: null }, "value")).toBeNull()
    expect(() => readErpInteger({ code: 7.5 }, "code")).toThrow("inteiro")
  })
})
