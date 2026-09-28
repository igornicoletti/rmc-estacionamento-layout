import { useEffect } from "react"
import { isRouteErrorResponse, useRouteError } from "react-router"

import { appMetadata } from "@/app/app-metadata"
import { FallbackRouteError } from "@/components/fallback/fallback-route-error"

export function RouteErrorBoundary() {
  const error: unknown = useRouteError()
  const status =
    isRouteErrorResponse(error) || error instanceof Response
      ? error.status
      : undefined
  const kind =
    status === 403 ? "forbidden" : status === 404 ? "notFound" : "unexpected"

  useEffect(() => {
    document.title = appMetadata.browserTitle
  }, [])

  return <FallbackRouteError kind={kind} />
}
