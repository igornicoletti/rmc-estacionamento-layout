import { describe, expect, it } from "vitest"

import { parseAuthRuntimeConfig } from "@/features/auth/config/auth-runtime-config"

describe("parseAuthRuntimeConfig", () => {
  it("permanece desabilitado na ausência de configuração", () => {
    expect(parseAuthRuntimeConfig({})).toEqual({ stage: "disabled" })
  })

  it("aceita candidate sem habilitar upstream no browser", () => {
    expect(
      parseAuthRuntimeConfig({ VITE_AUTH_STAGE: "candidate" }),
    ).toEqual({ stage: "candidate" })
  })

  it.each(["validated", "enabled", "preview"])(
    "rejeita estágio público inválido: %s",
    (stage) => {
      expect(() => parseAuthRuntimeConfig({ VITE_AUTH_STAGE: stage })).toThrow(
        "AUTH_CONFIG_INVALID_STAGE",
      )
    },
  )
})
