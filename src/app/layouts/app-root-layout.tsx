import type { ReactNode } from "react"

interface AppRootLayoutProps {
  children: ReactNode
}

export function AppRootLayout({ children }: AppRootLayoutProps) {
  return <main className="grid min-h-svh place-items-center p-6">{children}</main>
}
