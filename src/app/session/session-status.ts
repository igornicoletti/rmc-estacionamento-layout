import type { AuthenticatedSession } from "./session-types"

export type SessionSnapshot =
  | { status: "bootstrapping" }
  | { status: "anonymous" }
  | { status: "authenticated"; session: AuthenticatedSession }
  | { status: "unavailable" }

export type ResolvedSessionSnapshot = Extract<
  SessionSnapshot,
  { status: "anonymous" | "authenticated" }
>

export const bootstrappingSession: SessionSnapshot = {
  status: "bootstrapping",
}

export const anonymousSession: SessionSnapshot = { status: "anonymous" }
