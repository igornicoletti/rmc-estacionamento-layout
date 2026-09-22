import { Navigate, Outlet, useLocation, useMatches } from "react-router"

import { StandaloneLayout } from "../../layouts/standalone-layout"
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
    return null
  }

  return (
    <StandaloneLayout>
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Acesso não permitido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Você não tem permissão para acessar este conteúdo.
        </p>
      </div>
    </StandaloneLayout>
  )
}
