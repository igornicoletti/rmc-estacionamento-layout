import { useContext } from "react"

import { SessionContext } from "./session-context"

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error("SESSION_PROVIDER_MISSING")
  }

  return context
}
