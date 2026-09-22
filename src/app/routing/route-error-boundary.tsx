import { SearchX, ShieldX, TriangleAlert, type LucideIcon } from "lucide-react"
import { useEffect } from "react"
import { useRouteError } from "react-router"

import { APP_BROWSER_TITLE, appFeedback } from "@/app/app-config"
import { AppEmpty } from "@/components/common/app-empty"
import { StandaloneLayout } from "@/components/common/standalone-layout"
import { Button } from "@/components/ui/button"
import { readHttpStatus } from "@/lib/http-status"

type ErrorKind = keyof typeof appFeedback

const errorIcons = {
  forbidden: ShieldX,
  "not-found": SearchX,
  unexpected: TriangleAlert,
} satisfies Record<ErrorKind, LucideIcon>

export function RootErrorContent({ kind }: { kind: ErrorKind }) {
  const presentation = appFeedback[kind]
  const Icon = errorIcons[kind]

  return (
    <StandaloneLayout>
      <AppEmpty
        description={presentation.description}
        media={{ icon: Icon }}
        primaryAction={kind === "unexpected" ? (
          <Button onClick={() => window.location.reload()} type="button">
            Tentar novamente
          </Button>
        ) : undefined}
        title={presentation.title}
      />
    </StandaloneLayout>
  )
}

export function RootErrorBoundary() {
  const status = readHttpStatus(useRouteError())
  const kind = status === 403 ? "forbidden" : status === 404 ? "not-found" : "unexpected"

  useEffect(() => {
    document.title = APP_BROWSER_TITLE
  }, [])

  return <RootErrorContent kind={kind} />
}
