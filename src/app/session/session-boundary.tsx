import { WifiOff } from "lucide-react"
import type { ReactNode } from "react"

import { useSession } from "@/app/session/session-context"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { StandaloneLayout } from "@/components/common/standalone-layout"
import { AppEmpty } from "@/components/common/app-empty"

interface SessionUnavailableFallbackProps {
  isRetrying: boolean
  onRetry: () => void
}

export function SessionUnavailableFallback({
  isRetrying,
  onRetry,
}: SessionUnavailableFallbackProps) {
  return (
    <StandaloneLayout>
      <AppEmpty
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
            {isRetrying ? "Tentando novamente" : "Tentar novamente"}
          </Button>
        }
        description="Não foi possível confirmar sua sessão. Tente novamente."
        media={{ icon: WifiOff }}
        title="Sessão indisponível"
      />
    </StandaloneLayout>
  )
}

export function SessionBootstrapFallback() {
  return (
    <main aria-busy="true" className="grid min-h-svh place-items-center p-4">
      <Spinner aria-label="Inicializando aplicação" />
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
