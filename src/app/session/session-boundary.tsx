import { WifiOffIcon } from "lucide-react"
import type { ReactNode } from "react"

import { appCopy } from "@/app/config/app-copy"
import { AppRootLayout } from "@/app/layouts/app-root-layout"
import { useSession } from "@/app/session/session-context"
import { AppEmpty } from "@/components/common/app-empty"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface SessionUnavailableFallbackProps {
  isRetrying: boolean
  onRetry: () => void
}

export function SessionUnavailableFallback({
  isRetrying,
  onRetry,
}: SessionUnavailableFallbackProps) {
  const feedback = appCopy.feedback.sessionUnavailable

  return (
    <AppRootLayout>
      <AppEmpty
        description={feedback.description}
        media={{ icon: WifiOffIcon }}
        primaryAction={
          <Button
            aria-busy={isRetrying}
            disabled={isRetrying}
            onClick={onRetry}
            type="button"
          >
            {isRetrying ? (
              <Spinner aria-hidden="true" data-icon="inline-start" />
            ) : null}
            {isRetrying ? feedback.pendingAction : feedback.action}
          </Button>
        }
        title={feedback.title}
      />
    </AppRootLayout>
  )
}

export function SessionBootstrapFallback() {
  return (
    <main aria-busy="true" className="grid min-h-svh place-items-center p-6">
      <Spinner aria-label={appCopy.feedback.sessionBootstrap.label} />
    </main>
  )
}

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
