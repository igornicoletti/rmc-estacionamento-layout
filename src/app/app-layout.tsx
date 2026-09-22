import { useEffect } from "react"
import { Outlet, useMatches } from "react-router"

import { APP_BROWSER_TITLE } from "@/app/app-config"
import { isAppRouteHandle } from "@/app/routing/route-access"

export function AppLayout() {
  const matches = useMatches()
  const title = matches
    .map((match) => match.handle)
    .filter(isAppRouteHandle)
    .at(-1)?.title

  useEffect(() => {
    document.title = title ? `${title} | ${APP_BROWSER_TITLE}` : APP_BROWSER_TITLE
    return () => {
      document.title = APP_BROWSER_TITLE
    }
  }, [title])

  return <Outlet />
}
