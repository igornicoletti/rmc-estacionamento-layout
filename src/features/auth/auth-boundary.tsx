import type { ReactNode } from "react"

import { useSession } from "@/features/auth/auth-context"
import {
  FallbackSessionLoading,
  FallbackSessionUnavailable,
} from "@/components/fallback/fallback-session"

interface AuthBoundaryProps {
  children: ReactNode
}

export function AuthBoundary({ children }: AuthBoundaryProps) {
  const { isRefreshing, refresh, snapshot } = useSession()

  if (snapshot.status === "bootstrapping") {
    return <FallbackSessionLoading />
  }

  if (snapshot.status === "unavailable") {
    return (
      <FallbackSessionUnavailable
        isRetrying={isRefreshing}
        onRetry={() => void refresh().catch(() => undefined)}
      />
    )
  }

  return children
}
