import type { AssuranceLevel } from "@/shared/auth"
import type { UserCapability } from "@/shared/authorization/capability-catalog"

export type SessionCapability = UserCapability
export type SessionAssurance = AssuranceLevel

interface SessionIdentity {
  displayName: string
  id: string
}

interface AuthenticatedSession {
  assurance: SessionAssurance
  capabilities: readonly SessionCapability[]
  freshUntil: string | null
  identity: SessionIdentity
}

export type SessionSnapshot =
  | { status: "bootstrapping" }
  | { status: "anonymous" }
  | { status: "authenticated"; session: AuthenticatedSession }
  | { status: "unavailable" }

export type ResolvedSessionSnapshot = Extract<
  SessionSnapshot,
  { status: "anonymous" | "authenticated" }
>

export const bootstrappingSession = {
  status: "bootstrapping",
} satisfies SessionSnapshot

export const anonymousSession = {
  status: "anonymous",
} satisfies ResolvedSessionSnapshot
