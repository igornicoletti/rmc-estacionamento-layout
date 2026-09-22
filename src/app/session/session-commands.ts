import type { ResolvedSessionSnapshot } from "@/app/session/session-status"

export interface SessionCommands {
  getSession: (signal: AbortSignal) => Promise<ResolvedSessionSnapshot>
  refreshSession: (signal: AbortSignal) => Promise<ResolvedSessionSnapshot>
  signOut: (signal: AbortSignal) => Promise<void>
}

function resolveAnonymousSession(
  signal: AbortSignal,
): Promise<ResolvedSessionSnapshot> {
  if (signal.aborted) {
    return Promise.reject(
      new DOMException("The operation was aborted", "AbortError"),
    )
  }

  return Promise.resolve({ status: "anonymous" })
}

export const anonymousSessionCommands: SessionCommands = {
  getSession: resolveAnonymousSession,
  refreshSession: resolveAnonymousSession,
  signOut: (signal) => {
    if (signal.aborted) {
      return Promise.reject(
        new DOMException("The operation was aborted", "AbortError"),
      )
    }

    return Promise.resolve()
  },
}
