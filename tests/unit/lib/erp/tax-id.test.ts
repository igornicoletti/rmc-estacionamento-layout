import { describe, expect, it } from "vitest"

import { formatCnpj, formatCpfCnpj } from "@/lib/erp/tax-id"

describe("ERP tax IDs", () => {
  it("valida e formata CPF e CNPJ", () => {
    expect(formatCpfCnpj("11144477735")).toBe("111.444.777-35")
    expect(formatCpfCnpj("12345678000195")).toBe("12.345.678/0001-95")
    expect(formatCnpj("21384959000148")).toBe("21.384.959/0001-48")
  })

  it("rejeita documentos com tamanho ou dígitos verificadores inválidos", () => {
    expect(() => formatCpfCnpj("123")).toThrow("11 ou 14")
    expect(() => formatCpfCnpj("11111111111")).toThrow("validação")
    expect(() => formatCnpj("11111111111111")).toThrow("validação")
  })
})
