import { Navigate, Outlet, useLocation, useMatches } from "react-router"

import {
  evaluateRouteAccessPolicies,
  isAppRouteHandle,
  type RouteAccessPolicy,
} from "@/app/routing/route-access"
import { RootErrorContent } from "@/app/routing/route-error-boundary"
import { SessionBootstrapFallback } from "@/app/session/session-boundary"
import { useSession } from "@/app/session/session-context"

interface RouteAccessBoundaryProps {
  authenticationPath?: string
}

export function RouteAccessBoundary({
  authenticationPath,
}: RouteAccessBoundaryProps) {
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
    return <SessionBootstrapFallback />
  }

  return <RootErrorContent kind="forbidden" />
}
