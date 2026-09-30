import { createBrowserClient } from "@supabase/ssr"

import { getSupabaseRuntimeConfig } from "@/lib/supabase-runtime-config"

export function createClient() {
  const config = getSupabaseRuntimeConfig(import.meta.env)

  return createBrowserClient(config.url, config.publishableKey)
}
