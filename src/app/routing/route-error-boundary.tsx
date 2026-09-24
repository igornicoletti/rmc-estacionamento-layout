import {
  SearchXIcon,
  ShieldXIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"
import { useEffect } from "react"
import { useRouteError } from "react-router"

import { appCopy } from "@/app/config/app-copy"
import { APP_BROWSER_TITLE } from "@/app/config/app-config"
import { AppRootLayout } from "@/app/layouts/app-root-layout"
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
    <AppRootLayout>
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
    </AppRootLayout>
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
