import { Navigate, Outlet, useLocation, useMatches } from "react-router"

import { evaluateRouteAccess, isAppRouteHandle } from "@/app/routing/route-access"
import { SessionBootstrapFallback } from "@/app/session/session-boundary"
import { useSession } from "@/app/session/session-context"
import { RootErrorContent } from "@/app/routing/route-error-boundary"

interface RouteAccessBoundaryProps {
  authenticationPath?: string
}

export function RouteAccessBoundary({
  authenticationPath,
}: RouteAccessBoundaryProps) {
  const location = useLocation()
  const matches = useMatches()
  const { snapshot } = useSession()
  const handle = [...matches]
    .reverse()
    .map((match) => match.handle)
    .find(isAppRouteHandle)
  const decision = evaluateRouteAccess(snapshot, handle?.access, {
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
