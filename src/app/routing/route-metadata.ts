import {
  isRouteAccessPolicy,
  type RouteAccessPolicy,
} from "@/app/routing/access/route-access-policy"

export interface AppRouteHandle {
  access: RouteAccessPolicy
  breadcrumb?: string
  routeId: string
  title?: string
}

export function isAppRouteHandle(value: unknown): value is AppRouteHandle {
  return (
    typeof value === "object" &&
    value !== null &&
    "routeId" in value &&
    typeof value.routeId === "string" &&
    "access" in value &&
    isRouteAccessPolicy(value.access)
  )
}
