import type { ReactNode } from "react"

import { SessionBootstrapFallback } from "@/app/session/session-bootstrap-fallback"
import { SessionUnavailableFallback } from "@/app/session/session-unavailable-fallback"
import { useSession } from "@/app/session/use-session"

interface SessionBootstrapBoundaryProps {
  children: ReactNode
}

export function SessionBootstrapBoundary({
  children,
}: SessionBootstrapBoundaryProps) {
  const { isRefreshing, refresh, snapshot } = useSession()

  if (snapshot.status === "bootstrapping") {
    return <SessionBootstrapFallback />
  }

  if (snapshot.status === "unavailable") {
    return (
      <SessionUnavailableFallback
        isRetrying={isRefreshing}
        onRetry={() => void refresh().catch(() => undefined)}
      />
    )
  }

  return children
}
