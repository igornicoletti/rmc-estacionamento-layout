import {
  SearchXIcon,
  ShieldXIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"

import { fallbackContent } from "@/components/fallback/fallback-content"
import { FallbackPage } from "@/components/fallback/fallback-page"
import { AppEmpty } from "@/components/app/app-empty"
import { Button } from "@/components/ui/button"

export type FallbackRouteErrorKind = "forbidden" | "notFound" | "unexpected"

const errorIcons = {
  forbidden: ShieldXIcon,
  notFound: SearchXIcon,
  unexpected: TriangleAlertIcon,
} satisfies Record<FallbackRouteErrorKind, LucideIcon>

export function FallbackRouteError({ kind }: { kind: FallbackRouteErrorKind }) {
  const feedback = fallbackContent[kind]
  const Icon = errorIcons[kind]

  return (
    <FallbackPage>
      <AppEmpty
        description={feedback.description}
        headingLevel={1}
        media={{ icon: Icon }}
        title={feedback.title}
      >
        {"action" in feedback ? (
          <Button onClick={() => window.location.reload()} type="button">
            {feedback.action}
          </Button>
        ) : null}
      </AppEmpty>
    </FallbackPage>
  )
}
