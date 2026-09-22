import { createBrowserRouter, type RouteObject } from "react-router"

import { routes } from "./routes"

export function createAppRouter(routeObjects: RouteObject[] = routes) {
  return createBrowserRouter(routeObjects)
}

export const router = createAppRouter()
