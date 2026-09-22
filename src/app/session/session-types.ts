export type SessionCapability = string

export type SessionAssurance = "aal1" | "aal2" | "fresh-aal2"

export interface SessionIdentity {
  displayName: string
  id: string
}

export interface AuthenticatedSession {
  assurance: SessionAssurance
  capabilities: readonly SessionCapability[]
  identity: SessionIdentity
}
