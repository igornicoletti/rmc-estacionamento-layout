import { Outlet } from "react-router"

export function ProtectedLayout() {
  return (
    <main className="min-h-svh">
      <Outlet />
    </main>
  )
}
