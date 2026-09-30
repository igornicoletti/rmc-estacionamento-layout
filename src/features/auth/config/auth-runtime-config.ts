export type AuthReleaseStage = "disabled" | "candidate"

export interface AuthRuntimeConfig {
  stage: AuthReleaseStage
}

export type AuthRuntimeEnvironment = Readonly<Record<string, unknown>>

function readString(environment: AuthRuntimeEnvironment, name: string) {
  const value = environment[name]
  return typeof value === "string" ? value.trim() : ""
}

export function parseAuthRuntimeConfig(
  environment: AuthRuntimeEnvironment,
): AuthRuntimeConfig {
  const configuredStage = readString(environment, "VITE_AUTH_STAGE")
  const stage = configuredStage || "disabled"

  if (stage !== "disabled" && stage !== "candidate") {
    throw new Error("AUTH_CONFIG_INVALID_STAGE")
  }

  return { stage }
}

export function assertAuthRuntimeConfig(environment: AuthRuntimeEnvironment) {
  return parseAuthRuntimeConfig(environment)
}
