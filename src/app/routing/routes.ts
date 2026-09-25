import { createElement, type ComponentType } from "react"
import type { RouteObject } from "react-router"

import { appPages, type AppPageId } from "@/app/config/app-config"
import { RouteAccessBoundary } from "@/app/routing/route-access-boundary"
import type { AppRouteHandle } from "@/app/routing/route-access"
import { rootErrorKinds } from "@/app/routing/route-error"
import {
  RootErrorBoundary,
  RootErrorContent,
} from "@/app/routing/route-error-boundary"
import { AppLayout } from "@/app/root/app-layout"
import { AppShellRoute } from "@/app/shell/app-shell"
import { CLIENT_DETAILS_ROUTE_PATH } from "@/pages/clients/client-routes"

interface PageRouteModule {
  Component: ComponentType
}

type PageRouteLoader = () => Promise<PageRouteModule>

const pageLoaders = {
  "account-security": async () => {
    const { AccountSecurityPage } = await import(
      "@/pages/account-security/account-security.layout"
    )

    return { Component: AccountSecurityPage }
  },
  audit: async () => {
    const { AuditPage } = await import("@/pages/audit/audit.layout")

    return { Component: AuditPage }
  },
  clients: async () => {
    const { ClientsPage } = await import("@/pages/clients/clients.layout")

    return { Component: ClientsPage }
  },
  dashboard: async () => {
    const { DashboardPage } = await import(
      "@/pages/dashboard/dashboard.layout"
    )

    return { Component: DashboardPage }
  },
  notifications: async () => {
    const { NotificationsPage } = await import(
      "@/pages/notifications/notifications.layout"
    )

    return { Component: NotificationsPage }
  },
  permissions: async () => {
    const { PermissionsPage } = await import(
      "@/pages/permissions/permissions.layout"
    )

    return { Component: PermissionsPage }
  },
  prices: async () => {
    const { PricesPage } = await import("@/pages/prices/prices.layout")

    return { Component: PricesPage }
  },
  profile: async () => {
    const { ProfilePage } = await import("@/pages/profile/profile.layout")

    return { Component: ProfilePage }
  },
  reports: async () => {
    const { ReportsPage } = await import("@/pages/reports/reports.layout")

    return { Component: ReportsPage }
  },
  rules: async () => {
    const { RulesPage } = await import("@/pages/rules/rules.layout")

    return { Component: RulesPage }
  },
  units: async () => {
    const { UnitsPage } = await import("@/pages/units/units.layout")

    return { Component: UnitsPage }
  },
  users: async () => {
    const { UsersPage } = await import("@/pages/users/users.layout")

    return { Component: UsersPage }
  },
  "virtual-yard": async () => {
    const { VirtualYardPage } = await import(
      "@/pages/virtual-yard/virtual-yard.layout"
    )

    return { Component: VirtualYardPage }
  },
} satisfies Record<AppPageId, PageRouteLoader>

function createPageRoute(id: AppPageId): RouteObject {
  const page = appPages[id]
  const handle = {
    access: page.access,
    routeId: id,
    title: page.title,
  } satisfies AppRouteHandle
  const lazy = pageLoaders[id]

  return page.path === "/"
    ? { id, index: true, handle, lazy }
    : { id, path: page.path, handle, lazy }
}

const rmcPreviewRoute = {
  id: "rmc-preview",
  path: "/rmc",
  lazy: async () => {
    const { RmcPreviewPage } = await import("@/pages/rmc/rmc.layout")

    return { Component: RmcPreviewPage }
  },
  handle: {
    access: { authentication: "either" },
    routeId: "rmc-preview",
    title: "RMC",
  } satisfies AppRouteHandle,
} satisfies RouteObject

const clientDetailsRoute = {
  id: "client-details",
  path: CLIENT_DETAILS_ROUTE_PATH,
  lazy: async () => {
    const { ClientDetailsPage } = await import(
      "@/pages/clients/client-details.layout"
    )

    return { Component: ClientDetailsPage }
  },
  handle: {
    access: appPages.clients.access,
    routeId: "client-details",
    title: "Cliente",
  } satisfies AppRouteHandle,
} satisfies RouteObject

function NotFoundRoute() {
  return createElement(RootErrorContent, {
    kind: rootErrorKinds.notFound,
  })
}

export const routes = [
  {
    id: "app-root",
    Component: AppLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      {
        id: "access-boundary",
        Component: RouteAccessBoundary,
        children: [
          {
            id: "app-shell",
            Component: AppShellRoute,
            children: [
              ...(Object.keys(appPages) as AppPageId[]).map(createPageRoute),
              clientDetailsRoute,
              rmcPreviewRoute,
            ],
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
