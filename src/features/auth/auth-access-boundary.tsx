import { Navigate, Outlet, useLocation, useMatches } from "react-router"

import {
  evaluateRouteAccessPolicies,
  isAppRouteHandle,
  type RouteAccessPolicy,
} from "@/features/auth/auth-access-policy"
import { FallbackRouteError } from "@/components/fallback/fallback-route-error"
import { FallbackSessionLoading } from "@/components/fallback/fallback-session"
import { useSession } from "@/features/auth/auth-context"

interface AuthAccessBoundaryProps {
  authenticationPath?: string
}

export function AuthAccessBoundary({
  authenticationPath,
}: AuthAccessBoundaryProps) {
  const location = useLocation()
  const matches = useMatches()
  const { snapshot } = useSession()
  const policies: RouteAccessPolicy[] = []
  let hasInvalidHandle = false

  for (const match of matches) {
    if (match.handle === undefined) {
      continue
    }

    if (!isAppRouteHandle(match.handle)) {
      hasInvalidHandle = true
      break
    }

    policies.push(match.handle.access)
  }

  const decision = hasInvalidHandle
    ? ({ kind: "deny" } as const)
    : evaluateRouteAccessPolicies(snapshot, policies, {
        authenticationPath,
      })

  if (decision.kind === "allow") {
    return <Outlet />
  }

  if (decision.kind === "redirect") {
    return (
      <Navigate
        replace
        state={{
          returnTo: `${location.pathname}${location.search}${location.hash}`,
        }}
        to={decision.to}
      />
    )
  }

  if (decision.kind === "pending") {
    return <FallbackSessionLoading />
  }

  return <FallbackRouteError kind="forbidden" />
}
