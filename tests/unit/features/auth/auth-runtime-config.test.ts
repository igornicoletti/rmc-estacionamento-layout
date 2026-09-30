import { describe, expect, it } from "vitest"

import { parseAuthRuntimeConfig } from "@/features/auth/config/auth-runtime-config"

describe("parseAuthRuntimeConfig", () => {
  it("permanece desabilitado na ausência de configuração", () => {
    expect(parseAuthRuntimeConfig({})).toEqual({
      apiOrigin: null,
      stage: "disabled",
    })
  })

  it("aceita candidato apenas com uma origem HTTPS sem credenciais", () => {
    const config = parseAuthRuntimeConfig({
      VITE_AUTH_API_ORIGIN: "https://auth.example.com",
      VITE_AUTH_STAGE: "candidate",
    })

    expect(config.stage).toBe("candidate")
    expect(config.apiOrigin?.origin).toBe("https://auth.example.com")
  })

  it.each([
    {
      VITE_AUTH_API_ORIGIN: "https://auth.example.com",
      VITE_AUTH_STAGE: "disabled",
    },
    { VITE_AUTH_STAGE: "candidate" },
    {
      VITE_AUTH_API_ORIGIN: "http://auth.example.com",
      VITE_AUTH_STAGE: "candidate",
    },
    {
      VITE_AUTH_API_ORIGIN: "https://user:pass@auth.example.com",
      VITE_AUTH_STAGE: "candidate",
    },
    {
      VITE_AUTH_API_ORIGIN: "https://auth.example.com/api",
      VITE_AUTH_STAGE: "candidate",
    },
    { VITE_AUTH_STAGE: "validated" },
  ])("rejeita uma configuração permissiva ou incompleta: %#", (environment) => {
    expect(() => parseAuthRuntimeConfig(environment)).toThrow(/^AUTH_CONFIG_/)
  })
})
