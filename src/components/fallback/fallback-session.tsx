import { WifiOffIcon } from "lucide-react"

import { fallbackContent } from "@/components/fallback/fallback-content"
import { FallbackPage } from "@/components/fallback/fallback-page"
import { AppEmpty } from "@/components/app/app-empty"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface FallbackSessionUnavailableProps {
  isRetrying: boolean
  onRetry: () => void
}

export function FallbackSessionUnavailable({
  isRetrying,
  onRetry,
}: FallbackSessionUnavailableProps) {
  const feedback = fallbackContent.sessionUnavailable

  return (
    <FallbackPage>
      <AppEmpty
        description={feedback.description}
        headingLevel={1}
        media={{ icon: WifiOffIcon }}
        title={feedback.title}
      >
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
      </AppEmpty>
    </FallbackPage>
  )
}

export function FallbackSessionLoading() {
  return (
    <main aria-busy="true" className="grid min-h-svh place-items-center p-6">
      <Spinner aria-label={fallbackContent.sessionBootstrap.label} />
    </main>
  )
}
