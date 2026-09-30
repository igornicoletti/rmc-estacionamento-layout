export interface SupabaseRuntimeConfig {
  publishableKey: string
  url: string
}

type RuntimeEnvironment = Readonly<Record<string, unknown>>

function readRequired(environment: RuntimeEnvironment, name: string) {
  const value = environment[name]

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`SUPABASE_CONFIG_MISSING_${name}`)
  }

  return value.trim()
}

export function getSupabaseRuntimeConfig(
  environment: RuntimeEnvironment,
): SupabaseRuntimeConfig {
  const url = readRequired(environment, "VITE_SUPABASE_URL")

  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.protocol !== "https:" || parsedUrl.origin !== url) {
      throw new Error("SUPABASE_CONFIG_INVALID_URL")
    }
  } catch (error) {
    if (error instanceof Error && error.message === "SUPABASE_CONFIG_INVALID_URL") {
      throw error
    }

    throw new Error("SUPABASE_CONFIG_INVALID_URL", { cause: error })
  }

  return {
    publishableKey: readRequired(
      environment,
      "VITE_SUPABASE_PUBLISHABLE_KEY",
    ),
    url,
  }
}
