import { Outlet } from "react-router"

export function AuthLayout() {
  return (
    <main className="grid min-h-svh place-items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </main>
  )
}
