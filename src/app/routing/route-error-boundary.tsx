import { SearchXIcon, ShieldXIcon, TriangleAlertIcon, type LucideIcon } from "lucide-react"
import { useEffect } from "react"
import { useRouteError } from "react-router"

import { appCopy } from "@/app/app-copy"
import { APP_BROWSER_TITLE } from "@/app/app-config"
import { StandaloneLayout } from "@/app/layouts/standalone-layout"
import { AppEmpty } from "@/components/common/app-empty"
import { Button } from "@/components/ui/button"
import { readHttpStatus } from "@/lib/http-status"

type ErrorKind = "forbidden" | "notFound" | "unexpected"

const errorIcons = {
  forbidden: ShieldXIcon,
  notFound: SearchXIcon,
  unexpected: TriangleAlertIcon,
} satisfies Record<ErrorKind, LucideIcon>

export function RootErrorContent({ kind }: { kind: ErrorKind }) {
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
  const kind: ErrorKind =
    status === 403 ? "forbidden" : status === 404 ? "notFound" : "unexpected"

  useEffect(() => {
    document.title = APP_BROWSER_TITLE
  }, [])

  return <RootErrorContent kind={kind} />
}
