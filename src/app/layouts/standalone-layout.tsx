import type { ReactNode } from "react"

interface StandaloneLayoutProps {
  children: ReactNode
}

export function StandaloneLayout({ children }: StandaloneLayoutProps) {
  return <main className="grid min-h-svh place-items-center p-6">{children}</main>
}
