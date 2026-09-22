import type { ReactNode } from "react"

import { SessionBootstrapFallback } from "./session-bootstrap-fallback"
import { SessionUnavailableFallback } from "./session-unavailable-fallback"
import { useSession } from "./use-session"

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
