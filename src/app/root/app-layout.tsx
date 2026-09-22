import { useEffect } from "react"
import { Outlet, useMatches } from "react-router"

import { APP_BROWSER_TITLE } from "@/app/config/app-config"
import { isAppRouteHandle } from "@/app/routing/route-access"

export function AppLayout() {
  const matches = useMatches()
  const routeTitle = matches
    .map((match) => match.handle)
    .filter(isAppRouteHandle)
    .at(-1)?.title

  useEffect(() => {
    document.title = routeTitle
      ? `${routeTitle} | ${APP_BROWSER_TITLE}`
      : APP_BROWSER_TITLE
  }, [routeTitle])

  return <Outlet />
}
