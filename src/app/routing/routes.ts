import { createElement, type ComponentType } from "react"
import type { RouteObject } from "react-router"

import { ProtectedLayout } from "@/app/layouts/protected-layout"
import { RouteAccessBoundary } from "@/app/routing/access/route-access-boundary"
import {
  appRouteCatalog,
  getAppPage,
  type AppRouteId,
} from "@/app/routing/route-catalog"
import type { AppRouteHandle } from "@/app/routing/route-metadata"
import {
  getRootErrorPresentation,
  RootErrorBoundary,
  RootErrorContent,
} from "@/app/routing/root/root-error-boundary"
import { AccountSecurityPage } from "@/pages/account-security/page"
import { AuditPage } from "@/pages/audit/page"
import { ClientsPage } from "@/pages/clients/page"
import { DashboardPage } from "@/pages/dashboard/page"
import { NotificationsPage } from "@/pages/notifications/page"
import { PermissionsPage } from "@/pages/permissions/page"
import { PricesPage } from "@/pages/prices/page"
import { ProfilePage } from "@/pages/profile/page"
import { ReportsPage } from "@/pages/reports/page"
import { RulesPage } from "@/pages/rules/page"
import { UnitsPage } from "@/pages/units/page"
import { UsersPage } from "@/pages/users/page"
import { VirtualYardPage } from "@/pages/virtual-yard/page"

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
} satisfies Record<AppRouteId, ComponentType>

function createPageRoute(id: AppRouteId): RouteObject {
  const page = getAppPage(id)
  const handle = {
    access: { authentication: "either" },
    breadcrumb: page.title,
    routeId: page.id,
    title: page.title,
  } satisfies AppRouteHandle

  return page.segment === null
    ? { id: page.id, index: true, Component: pageComponents[id], handle }
    : {
        id: page.id,
        path: page.segment,
        Component: pageComponents[id],
        handle,
      }
}

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
            id: "protected-layout",
            Component: ProtectedLayout,
            children: appRouteCatalog.map(({ id }) => createPageRoute(id)),
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
