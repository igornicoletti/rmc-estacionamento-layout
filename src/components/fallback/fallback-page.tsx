import type { ReactNode } from "react"

interface FallbackPageProps {
  children: ReactNode
}

export function FallbackPage({ children }: FallbackPageProps) {
  return (
    <main className="grid min-h-svh place-items-center p-6">{children}</main>
  )
}
