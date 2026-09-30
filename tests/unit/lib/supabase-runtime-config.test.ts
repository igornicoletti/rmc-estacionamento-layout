import { describe, expect, it } from "vitest"

import { getSupabaseRuntimeConfig } from "@/lib/supabase-runtime-config"

describe("getSupabaseRuntimeConfig", () => {
  it("aceita somente configuração pública completa e HTTPS", () => {
    expect(
      getSupabaseRuntimeConfig({
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
        VITE_SUPABASE_URL: "https://project.supabase.co",
      }),
    ).toEqual({
      publishableKey: "sb_publishable_example",
      url: "https://project.supabase.co",
    })
  })

  it.each([
    {},
    {
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      VITE_SUPABASE_URL: "http://project.supabase.co",
    },
    {
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      VITE_SUPABASE_URL: "https://project.supabase.co/rest/v1",
    },
  ])("rejeita configuração ausente ou ambígua: %#", (environment) => {
    expect(() => getSupabaseRuntimeConfig(environment)).toThrow(
      /^SUPABASE_CONFIG_/,
    )
  })
})
