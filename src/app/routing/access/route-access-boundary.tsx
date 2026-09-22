import { ShieldX } from "lucide-react"
import { Navigate, Outlet, useLocation, useMatches } from "react-router"

import { AppEmptyState } from "../../fallbacks/app-empty-state"
import { StandaloneLayout } from "../../layouts/standalone-layout"
import { SessionBootstrapFallback } from "../../session/session-bootstrap-fallback"
import { useSession } from "../../session/use-session"
import { isAppRouteHandle } from "../route-metadata"
import { evaluateRouteAccess } from "./route-access-policy"

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

  return (
    <StandaloneLayout>
      <AppEmptyState
        description="Você não tem permissão para acessar este conteúdo."
        icon={ShieldX}
        title="Acesso não permitido"
      />
    </StandaloneLayout>
  )
}
