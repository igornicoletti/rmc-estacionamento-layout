import { Outlet } from "react-router"

import { RouteDocumentTitle } from "@/app/routing/route-document-title"

export function ProtectedLayout() {
  return (
    <main className="min-h-svh">
      <RouteDocumentTitle />
      <Outlet />
    </main>
  )
}
