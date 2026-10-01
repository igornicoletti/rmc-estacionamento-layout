import type {
  AssuranceLevel,
  Lifecycle,
  Onboarding,
  SessionSnapshot,
} from "./auth-contracts"
import type { AuditEvent } from "./auth-audit"

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
export type EncryptedEnvelope = {
  codecVersion: 1
  algorithm: "A256GCM"
  ciphertext: Uint8Array
  keyVersion: number
  purpose: string
  binding: string
}
export type QueueEnvelope = {
  idempotencyKey: string
  messageId: string
  purpose: string
  generation: number
  envelope: EncryptedEnvelope
}

export interface Clock {
  now(): Date
}

export interface CryptoProvider {
  randomBytes(length: number): Uint8Array
  hmac(purpose: string, value: Uint8Array, keyVersion: number): Promise<Uint8Array>
  seal(
    purpose: string,
    plaintext: Uint8Array,
    binding: string,
  ): Promise<EncryptedEnvelope>
  open(envelope: EncryptedEnvelope): Promise<Uint8Array>
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

export interface QueuePublisher {
  publish(
    message: QueueEnvelope,
    context: Abortable,
  ): Promise<{ messageId: string }>
}

export interface AuditSink {
  append(event: AuditEvent, context: Abortable): Promise<void>
}
