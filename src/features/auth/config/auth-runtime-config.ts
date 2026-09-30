export type AuthReleaseStage = "disabled" | "candidate"

export interface AuthRuntimeConfig {
  apiOrigin: URL | null
  stage: AuthReleaseStage
}

export type AuthRuntimeEnvironment = Readonly<
  Record<string, string | boolean | undefined>
>

const releaseStages = new Set<AuthReleaseStage>(["disabled", "candidate"])

function readString(environment: AuthRuntimeEnvironment, name: string) {
  const value = environment[name]
  return typeof value === "string" ? value.trim() : ""
}

function parseApiOrigin(value: string) {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new Error("AUTH_CONFIG_INVALID_API_ORIGIN")
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("AUTH_CONFIG_INVALID_API_ORIGIN")
  }

  return url
}

/**
 * Validates only public, non-secret build configuration. `validated` is
 * intentionally not a browser stage: it requires a release manifest and
 * target evidence outside the bundle.
 */
export function parseAuthRuntimeConfig(
  environment: AuthRuntimeEnvironment,
): AuthRuntimeConfig {
  const configuredStage = readString(environment, "VITE_AUTH_STAGE")
  const stage = (configuredStage || "disabled") as AuthReleaseStage
  const apiOrigin = readString(environment, "VITE_AUTH_API_ORIGIN")

  if (!releaseStages.has(stage)) {
    throw new Error("AUTH_CONFIG_INVALID_STAGE")
  }

  if (stage === "disabled") {
    if (apiOrigin) {
      throw new Error("AUTH_CONFIG_DISABLED_WITH_API_ORIGIN")
    }

    return { apiOrigin: null, stage }
  }

  if (!apiOrigin) {
    throw new Error("AUTH_CONFIG_MISSING_API_ORIGIN")
  }

  return { apiOrigin: parseApiOrigin(apiOrigin), stage }
}

export function assertAuthRuntimeConfig(environment: AuthRuntimeEnvironment) {
  return parseAuthRuntimeConfig(environment)
}
