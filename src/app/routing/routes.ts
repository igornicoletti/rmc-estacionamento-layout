import { createElement } from "react"
import type { RouteObject } from "react-router"

import CurrentApp from "@/App"

import { RouteAccessBoundary } from "./access/route-access-boundary"
import type { AppRouteHandle } from "./route-metadata"
import {
  getRootErrorPresentation,
  RootErrorBoundary,
  RootErrorContent,
} from "./root/root-error-boundary"

const homeHandle = {
  access: { authentication: "either" },
  routeId: "home",
  title: "RMC Estacionamento",
} satisfies AppRouteHandle

function NotFoundRoute() {
  return createElement(RootErrorContent, {
    presentation: getRootErrorPresentation({ status: 404 }),
  })
}

export const routes = [
  {
    id: "app-root",
    ErrorBoundary: RootErrorBoundary,
    children: [
      {
        id: "access-boundary",
        Component: RouteAccessBoundary,
        children: [
          {
            id: "home",
            index: true,
            Component: CurrentApp,
            handle: homeHandle,
          },
        ],
      },
      {
        id: "not-found",
        path: "*",
        Component: NotFoundRoute,
      },
    ],
  },
] satisfies RouteObject[]
