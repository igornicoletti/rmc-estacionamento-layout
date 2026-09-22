import type { SessionSnapshot } from "../../session/session-status"
import type {
  SessionAssurance,
  SessionCapability,
} from "../../session/session-types"

export interface RouteAccessPolicy {
  assurance?: SessionAssurance
  authentication: "required" | "anonymous-only" | "either"
  capabilities?: readonly SessionCapability[]
}

export type RouteAccessDecision =
  | { kind: "allow" }
  | { kind: "pending" }
  | { kind: "redirect"; to: string }
  | { kind: "deny" }

export interface RouteAccessOptions {
  authenticationPath?: string
}

const assuranceRank: Record<SessionAssurance, number> = {
  aal1: 1,
  aal2: 2,
  "fresh-aal2": 3,
}

const authenticationModes = new Set([
  "required",
  "anonymous-only",
  "either",
])
const assuranceLevels = new Set<SessionAssurance>([
  "aal1",
  "aal2",
  "fresh-aal2",
])

export function isRouteAccessPolicy(value: unknown): value is RouteAccessPolicy {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const authentication =
    "authentication" in value ? value.authentication : undefined
  const assurance = "assurance" in value ? value.assurance : undefined
  const capabilities =
    "capabilities" in value ? value.capabilities : undefined

  return (
    typeof authentication === "string" &&
    authenticationModes.has(authentication) &&
    (assurance === undefined ||
      (typeof assurance === "string" &&
        assuranceLevels.has(assurance as SessionAssurance))) &&
    (capabilities === undefined ||
      (Array.isArray(capabilities) &&
        capabilities.every((capability) => typeof capability === "string")))
  )
}

export function evaluateRouteAccess(
  snapshot: SessionSnapshot,
  policy: RouteAccessPolicy | undefined,
  options: RouteAccessOptions = {},
): RouteAccessDecision {
  if (!isRouteAccessPolicy(policy) || snapshot.status === "unavailable") {
    return { kind: "deny" }
  }

  if (snapshot.status === "bootstrapping") {
    return { kind: "pending" }
  }

  if (policy.authentication === "anonymous-only") {
    return snapshot.status === "anonymous"
      ? { kind: "allow" }
      : { kind: "redirect", to: "/" }
  }

  if (policy.authentication === "required" && snapshot.status === "anonymous") {
    return options.authenticationPath
      ? { kind: "redirect", to: options.authenticationPath }
      : { kind: "deny" }
  }

  if (snapshot.status === "anonymous") {
    const hasAuthenticatedRequirements =
      policy.assurance !== undefined || (policy.capabilities?.length ?? 0) > 0
    return hasAuthenticatedRequirements ? { kind: "deny" } : { kind: "allow" }
  }

  if (policy.assurance) {
    const actualRank = assuranceRank[snapshot.session.assurance]
    const requiredRank = assuranceRank[policy.assurance]
    if (!actualRank || !requiredRank || actualRank < requiredRank) {
      return { kind: "deny" }
    }
  }

  const capabilities = new Set(snapshot.session.capabilities)
  if (policy.capabilities?.some((capability) => !capabilities.has(capability))) {
    return { kind: "deny" }
  }

  return { kind: "allow" }
}
