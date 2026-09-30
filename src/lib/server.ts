import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr"

import { getSupabaseRuntimeConfig } from "@/lib/supabase-runtime-config"

export function createClient(request: Request) {
  const headers = new Headers()
  const config = getSupabaseRuntimeConfig(import.meta.env)

  const supabase = createServerClient(
    config.url,
    config.publishableKey,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "")
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            ),
          )
        },
      },
    },
  )

  return { supabase, headers }
}
