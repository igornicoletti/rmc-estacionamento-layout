import { useContext } from "react"

import { SessionContext } from "@/app/session/session-context"

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error("SESSION_PROVIDER_MISSING")
  }

  return context
}
