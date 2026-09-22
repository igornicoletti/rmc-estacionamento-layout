import type {
  SessionAssurance,
  SessionCapability,
  SessionSnapshot,
} from "@/app/session/session-types"

interface AuthenticatedRouteRequirements {
  assurance?: SessionAssurance
  capabilities?: readonly SessionCapability[]
}

export type RouteAccessPolicy =
  | {
      authentication: "anonymous-only"
      assurance?: never
      capabilities?: never
    }
  | ({
      authentication: "required" | "either"
    } & AuthenticatedRouteRequirements)

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
const assuranceLevels: ReadonlySet<string> = new Set([
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
  const hasAuthenticatedRequirements =
    assurance !== undefined ||
    (Array.isArray(capabilities) && capabilities.length > 0)

  if (
    typeof authentication !== "string" ||
    !authenticationModes.has(authentication)
  ) {
    return false
  }

  if (authentication === "anonymous-only" && hasAuthenticatedRequirements) {
    return false
  }

  return (
    (assurance === undefined ||
      (typeof assurance === "string" && assuranceLevels.has(assurance))) &&
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

export function evaluateRouteAccessPolicies(
  snapshot: SessionSnapshot,
  policies: readonly RouteAccessPolicy[],
  options: RouteAccessOptions = {},
): RouteAccessDecision {
  if (policies.length === 0) {
    return { kind: "deny" }
  }

  let redirect: Extract<RouteAccessDecision, { kind: "redirect" }> | undefined

  for (const policy of policies) {
    const decision = evaluateRouteAccess(snapshot, policy, options)

    if (decision.kind === "deny" || decision.kind === "pending") {
      return decision
    }

    if (decision.kind === "redirect") {
      redirect ??= decision
    }
  }

  return redirect ?? { kind: "allow" }
}

export interface AppRouteHandle {
  access: RouteAccessPolicy
  routeId: string
  title?: string
}

export function isAppRouteHandle(value: unknown): value is AppRouteHandle {
  return (
    typeof value === "object" &&
    value !== null &&
    "routeId" in value &&
    typeof value.routeId === "string" &&
    "access" in value &&
    isRouteAccessPolicy(value.access) &&
    (!("title" in value) ||
      value.title === undefined ||
      typeof value.title === "string")
  )
}
