import type {
  AssuranceLevel,
  Lifecycle,
  Onboarding,
  SessionSnapshot,
} from "./auth-contracts"

export type Abortable = { signal: AbortSignal }
export type CommandContext = Abortable & { commandId: string; requestId: string }
export type ProviderIdentity = {
  providerSubject: string
  assurance: AssuranceLevel
}
export type IdentityState = {
  identityId: string
  lifecycle: Lifecycle
  onboarding: Onboarding
}

export interface Clock {
  now(): Date
}

export interface AuthProvider {
  verifyPassword(
    selector: string,
    password: string,
    context: CommandContext,
  ): Promise<ProviderIdentity>
  revokeSessions(
    providerSubject: string,
    context: CommandContext,
  ): Promise<void>
}

export interface DatabaseGateway {
  readIdentity(
    identityId: string,
    context: Abortable,
  ): Promise<IdentityState | null>
  readSessionSnapshot(
    contextId: string,
    context: Abortable,
  ): Promise<SessionSnapshot>
}

export interface SmsGateway {
  send(
    message: { idempotencyKey: string; phone: string; body: string },
    context: Abortable,
  ): Promise<{ outcomeId: string }>
  readOutcome(
    outcomeId: string,
    context: Abortable,
  ): Promise<"accepted" | "delivered" | "failed" | "unknown">
}
