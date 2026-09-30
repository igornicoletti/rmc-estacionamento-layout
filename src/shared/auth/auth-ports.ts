import type {
  AssuranceLevel,
  AuthorityPurpose,
  Lifecycle,
  Onboarding,
  SessionSnapshot,
} from "./auth-contracts"

export type Abortable = { signal: AbortSignal }
export type CommandContext = Abortable & { commandId: string; requestId: string }
export type ProviderIdentity = { providerSubject: string; assurance: AssuranceLevel }
export type IdentityState = { identityId: string; lifecycle: Lifecycle; onboarding: Onboarding }
export type QueueMessage = { idempotencyKey: string; purpose: AuthorityPurpose; generation: number; payload: unknown }
export type AuditEvent = { eventId: string; type: string; occurredAt: string; fields: Readonly<Record<string, string | number | boolean | null>> }

export interface Clock {
  now(): Date
}

export interface CryptoProvider {
  randomBytes(length: number): Uint8Array
  hash(value: Uint8Array): Promise<Uint8Array>
  seal(purpose: string, plaintext: Uint8Array, binding: string): Promise<Uint8Array>
  open(purpose: string, ciphertext: Uint8Array, binding: string): Promise<Uint8Array>
}

export interface AuthProvider {
  verifyPassword(selector: string, password: string, context: CommandContext): Promise<ProviderIdentity>
  revokeSessions(providerSubject: string, context: CommandContext): Promise<void>
}

export interface DatabaseGateway {
  readIdentity(identityId: string, context: Abortable): Promise<IdentityState | null>
  readSessionSnapshot(contextId: string, context: Abortable): Promise<SessionSnapshot>
}

export interface SmsGateway {
  send(message: { idempotencyKey: string; phone: string; body: string }, context: Abortable): Promise<{ outcomeId: string }>
  readOutcome(outcomeId: string, context: Abortable): Promise<"accepted" | "delivered" | "failed" | "unknown">
}

export interface QueuePublisher {
  publish(message: QueueMessage, context: Abortable): Promise<void>
}

export interface AuditSink {
  append(event: AuditEvent, context: Abortable): Promise<void>
}

