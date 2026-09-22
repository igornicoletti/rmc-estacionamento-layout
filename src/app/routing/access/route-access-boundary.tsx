import { ShieldX } from "lucide-react"
import { Navigate, Outlet, useLocation, useMatches } from "react-router"

import { StandaloneLayout } from "@/app/layouts/standalone-layout"
import { evaluateRouteAccess } from "@/app/routing/access/route-access-policy"
import { isAppRouteHandle } from "@/app/routing/route-metadata"
import { SessionBootstrapFallback } from "@/app/session/session-bootstrap-fallback"
import { useSession } from "@/app/session/use-session"
import { AppEmpty } from "@/components/common/app-empty"

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
      <AppEmpty
        description="Você não tem permissão para acessar este conteúdo."
        media={{ icon: ShieldX }}
        title="Acesso não permitido"
      />
    </StandaloneLayout>
  )
}
