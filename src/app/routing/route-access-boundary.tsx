import { Navigate, Outlet, useLocation, useMatches } from "react-router"

import {
  evaluateRouteAccessPolicies,
  isAppRouteHandle,
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
  const policies = matches
    .map((match) => match.handle)
    .filter(isAppRouteHandle)
    .map((handle) => handle.access)
  const decision = evaluateRouteAccessPolicies(snapshot, policies, {
    authenticationPath,
  })

  if (decision.kind === "allow") {
    return <Outlet />
  }

  if (decision.kind === "redirect") {
    return (
      <Navigate
        replace
        state={{ returnTo: `${location.pathname}${location.search}` }}
        to={decision.to}
      />
    )
  }

  if (decision.kind === "pending") {
    return <SessionBootstrapFallback />
  }

  return <RootErrorContent kind="forbidden" />
}
