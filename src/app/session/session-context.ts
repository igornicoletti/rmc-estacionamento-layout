import { createContext, useContext } from "react"

import type { SessionSnapshot } from "@/app/session/session-types"

export interface SessionContextValue {
  isRefreshing: boolean
  isSigningOut: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
  snapshot: SessionSnapshot
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error("SESSION_PROVIDER_MISSING")
  }

  return context
}
