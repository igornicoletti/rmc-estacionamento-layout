import { createContext } from "react"

import type { SessionSnapshot } from "./session-status"

export interface SessionContextValue {
  isRefreshing: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
  snapshot: SessionSnapshot
}

export const SessionContext = createContext<SessionContextValue | null>(null)
