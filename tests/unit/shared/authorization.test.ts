import { describe, expect, it } from "vitest"

import { recognizeCapability, userCapabilities } from "@/shared/authorization"

describe("catálogo de capabilities", () => {
  it("contém as 17 capabilities Users do contrato", () => {
    expect(userCapabilities).toHaveLength(17)
  })

  it("falha fechado para capability desconhecida", () => {
    expect(recognizeCapability("users.read")).toEqual({
      allowed: true,
      capability: "users.read",
    })
    expect(recognizeCapability("users.future")).toEqual({
      allowed: false,
      reason: "UNKNOWN_CAPABILITY",
    })
  })
})
