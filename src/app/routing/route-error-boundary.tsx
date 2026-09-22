import {
  SearchXIcon,
  ShieldXIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"
import { useEffect } from "react"
import { useRouteError } from "react-router"

import { appCopy } from "@/app/app-copy"
import { APP_BROWSER_TITLE } from "@/app/app-config"
import { StandaloneLayout } from "@/app/layouts/standalone-layout"
import {
  rootErrorKinds,
  type RootErrorKind,
} from "@/app/routing/route-error"
import { AppEmpty } from "@/components/common/app-empty"
import { Button } from "@/components/ui/button"
import { readHttpStatus } from "@/lib/http-status"

const errorIcons = {
  forbidden: ShieldXIcon,
  notFound: SearchXIcon,
  unexpected: TriangleAlertIcon,
} satisfies Record<RootErrorKind, LucideIcon>

export function RootErrorContent({ kind }: { kind: RootErrorKind }) {
  const feedback = appCopy.feedback[kind]
  const Icon = errorIcons[kind]

  return (
    <StandaloneLayout>
      <AppEmpty
        description={feedback.description}
        media={{ icon: Icon }}
        primaryAction={
          "action" in feedback ? (
            <Button onClick={() => window.location.reload()} type="button">
              {feedback.action}
            </Button>
          ) : undefined
        }
        title={feedback.title}
      />
    </StandaloneLayout>
  )
}

export function RootErrorBoundary() {
  const status = readHttpStatus(useRouteError())
  const kind =
    status === 403
      ? rootErrorKinds.forbidden
      : status === 404
        ? rootErrorKinds.notFound
        : rootErrorKinds.unexpected

  useEffect(() => {
    document.title = APP_BROWSER_TITLE
  }, [])

  return <RootErrorContent kind={kind} />
}
