export type SessionCapability = string

export type SessionAssurance = "aal1" | "aal2" | "fresh-aal2"

interface SessionIdentity {
  displayName: string
  id: string
}

interface AuthenticatedSession {
  assurance: SessionAssurance
  capabilities: readonly SessionCapability[]
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
