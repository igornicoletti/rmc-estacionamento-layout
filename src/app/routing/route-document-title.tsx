import { useEffect } from "react"
import { useMatches } from "react-router"

import { APP_BROWSER_TITLE } from "@/app/config/app-config"
import { isAppRouteHandle } from "@/app/routing/route-metadata"

export function RouteDocumentTitle() {
  const matches = useMatches()
  const title = [...matches]
    .reverse()
    .map((match) => match.handle)
    .find(isAppRouteHandle)?.title

  useEffect(() => {
    document.title = title
      ? `${title} | ${APP_BROWSER_TITLE}`
      : APP_BROWSER_TITLE
  }, [title])

  return null
}
