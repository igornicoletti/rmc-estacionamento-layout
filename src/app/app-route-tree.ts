import { createElement, useEffect, type ComponentType } from "react"
import { Outlet, useMatches, type RouteObject } from "react-router"

import {
  appRoutes,
  appPageRouteIds,
  type AppPageRouteId,
} from "@/app/app-routes"
import { AuthAccessBoundary } from "@/features/auth/auth-access-boundary"
import {
  isAppRouteHandle,
  type AppRouteHandle,
} from "@/features/auth/auth-access-policy"
import { RouteErrorBoundary } from "@/app/app-route-error-boundary"
import { FallbackRouteError } from "@/components/fallback/fallback-route-error"
import { appMetadata } from "@/app/app-metadata"
import { MockShellRoute } from "@/mocks/mock-shell-route"

interface PageRouteModule {
  Component: ComponentType
}

type PageRouteLoader = () => Promise<PageRouteModule>

const pageLoaders = {
  "account-security": async () => {
    const { AccountSecurityPage } =
      await import("@/pages/account-security/account-security.layout")

    return { Component: AccountSecurityPage }
  },
  audit: async () => {
    const { AuditPage } = await import("@/pages/audit/audit.layout")

    return { Component: AuditPage }
  },
  clients: async () => {
    const { ClientsPage } = await import("@/features/clients/clients-page")

    return { Component: ClientsPage }
  },
  dashboard: async () => {
    const { DashboardPage } = await import("@/features/dashboard/dashboard-page")

    return { Component: DashboardPage }
  },
  notifications: async () => {
    const { NotificationsPage } =
      await import("@/pages/notifications/notifications.layout")

    return { Component: NotificationsPage }
  },
  permissions: async () => {
    const { PermissionsPage } =
      await import("@/pages/permissions/permissions.layout")

    return { Component: PermissionsPage }
  },
  prices: async () => {
    const { PricesPage } = await import("@/features/prices/prices-page")

    return { Component: PricesPage }
  },
  profile: async () => {
    const { ProfilePage } = await import("@/pages/profile/profile.layout")

    return { Component: ProfilePage }
  },
  reports: async () => {
    const { ReportsPage } = await import("@/features/reports/reports-page")

    return { Component: ReportsPage }
  },
  rules: async () => {
    const { RulesPage } = await import("@/features/rules/rules-page")

    return { Component: RulesPage }
  },
  units: async () => {
    const { UnitsPage } = await import("@/features/units/units-page")

    return { Component: UnitsPage }
  },
  users: async () => {
    const { UsersPage } = await import("@/pages/users/users.layout")

    return { Component: UsersPage }
  },
  "virtual-yard": async () => {
    const { VirtualYardPage } =
      await import("@/features/virtual-yard/virtual-yard-page")

    return { Component: VirtualYardPage }
  },
} satisfies Record<AppPageRouteId, PageRouteLoader>

function createPageRoute(id: AppPageRouteId): RouteObject {
  const page = appRoutes[id]
  const handle = {
    access: { authentication: "either" },
    routeId: page.id,
    title: page.browserTitle,
  } satisfies AppRouteHandle
  const lazy = pageLoaders[id]

  return page.path === "/"
    ? { id, index: true, handle, lazy }
    : { id, path: page.path, handle, lazy }
}

const rmcPreviewRoute = {
  id: appRoutes.preview.id,
  path: appRoutes.preview.path,
  lazy: async () => {
    const { RmcPreviewPage } = await import("@/mocks/mock-components-page")

    return { Component: RmcPreviewPage }
  },
  handle: {
    access: { authentication: "either" },
    routeId: appRoutes.preview.id,
    title: appRoutes.preview.browserTitle,
  } satisfies AppRouteHandle,
} satisfies RouteObject

const clientDetailsRoute = {
  id: appRoutes.clientDetails.id,
  path: appRoutes.clientDetails.pattern,
  lazy: async () => {
    const { ClientDetailsPage } =
      await import("@/features/clients/clients-details-page")

    return { Component: ClientDetailsPage }
  },
  handle: {
    access: { authentication: "either" },
    routeId: appRoutes.clientDetails.id,
    title: appRoutes.clientDetails.browserTitle,
  } satisfies AppRouteHandle,
} satisfies RouteObject

function NotFoundRoute() {
  return createElement(FallbackRouteError, {
    kind: "notFound",
  })
}

// All routes remain public until the real Auth contract is implemented.
function RouteRoot() {
  const matches = useMatches()
  const routeTitle = matches
    .map((match) => match.handle)
    .filter(isAppRouteHandle)
    .at(-1)?.title
  useEffect(() => {
    document.title = routeTitle
      ? `${routeTitle} | ${appMetadata.browserTitle}`
      : appMetadata.browserTitle
  }, [routeTitle])
  return createElement(Outlet)
}

export const routes = [
  {
    id: "app-root",
    Component: RouteRoot,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        id: "access-boundary",
        Component: AuthAccessBoundary,
        children: [
          {
            id: "app-shell",
            Component: MockShellRoute,
            children: [
              ...appPageRouteIds.map(createPageRoute),
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
