import { createElement, type ComponentType } from "react"
import type { RouteObject } from "react-router"

import { appPages, type AppPageId } from "@/app/config/app-config"
import { AppLayout } from "@/app/root/app-layout"
import { AppShellRoute } from "@/app/shell/app-shell"
import { RouteAccessBoundary } from "@/app/routing/route-access-boundary"
import type { AppRouteHandle } from "@/app/routing/route-access"
import { rootErrorKinds } from "@/app/routing/route-error"
import {
  RootErrorBoundary,
  RootErrorContent,
} from "@/app/routing/route-error-boundary"
import { AccountSecurityPage } from "@/pages/account-security/account-security.layout"
import { AuditPage } from "@/pages/audit/audit.layout"
import { ClientDetailsPage } from "@/pages/clients/client-details.layout"
import { CLIENT_DETAILS_ROUTE_PATH } from "@/pages/clients/client-routes"
import { ClientsPage } from "@/pages/clients/clients.layout"
import { DashboardPage } from "@/pages/dashboard/dashboard.layout"
import { NotificationsPage } from "@/pages/notifications/notifications.layout"
import { PermissionsPage } from "@/pages/permissions/permissions.layout"
import { PricesPage } from "@/pages/prices/prices.layout"
import { ProfilePage } from "@/pages/profile/profile.layout"
import { ReportsPage } from "@/pages/reports/reports.layout"
import { RulesPage } from "@/pages/rules/rules.layout"
import { UnitsPage } from "@/pages/units/units.layout"
import { UsersPage } from "@/pages/users/users.layout"
import { VirtualYardPage } from "@/pages/virtual-yard/virtual-yard.layout"

const pageComponents = {
  "account-security": AccountSecurityPage,
  audit: AuditPage,
  clients: ClientsPage,
  dashboard: DashboardPage,
  notifications: NotificationsPage,
  permissions: PermissionsPage,
  prices: PricesPage,
  profile: ProfilePage,
  reports: ReportsPage,
  rules: RulesPage,
  units: UnitsPage,
  users: UsersPage,
  "virtual-yard": VirtualYardPage,
} satisfies Record<AppPageId, ComponentType>

function createPageRoute(id: AppPageId): RouteObject {
  const page = appPages[id]
  const Component = pageComponents[id]
  const handle = {
    access: page.access,
    routeId: id,
    title: page.title,
  } satisfies AppRouteHandle

  return page.path === "/"
    ? { id, index: true, Component, handle }
    : { id, path: page.path, Component, handle }
}

const clientDetailsRoute = {
  id: "client-details",
  path: CLIENT_DETAILS_ROUTE_PATH,
  Component: ClientDetailsPage,
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
