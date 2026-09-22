import { WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { StandaloneLayout } from "@/app/layouts/standalone-layout"
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
