import { TriangleAlertIcon } from "lucide-react"

import { fallbackContent } from "@/components/fallback/fallback-content"
import { FallbackPage } from "@/components/fallback/fallback-page"
import { AppEmpty } from "@/components/app/app-empty"
import { Button } from "@/components/ui/button"

export function FallbackApplicationError({
  onReload,
}: {
  onReload: () => void
}) {
  const feedback = fallbackContent.applicationFailure
  return (
    <FallbackPage>
      <AppEmpty
        description={feedback.description}
        headingLevel={1}
        media={{ icon: TriangleAlertIcon }}
        title={feedback.title}
      >
        <Button onClick={onReload} type="button">
          {feedback.action}
        </Button>
      </AppEmpty>
    </FallbackPage>
  )
}
