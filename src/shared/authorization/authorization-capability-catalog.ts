export const userCapabilities = [
  "users.read",
  "users.create",
  "users.update_profile",
  "users.change_role",
  "users.change_unit",
  "users.resend_activation",
  "users.start_recovery",
  "users.suspend",
  "users.resume",
  "users.block",
  "users.unblock",
  "users.disable",
  "users.reactivate",
  "users.end_session",
  "users.reset_mfa",
  "users.audit.read",
  "users.cpf.reveal",
] as const

export type UserCapability = (typeof userCapabilities)[number]

const knownCapabilities: ReadonlySet<string> = new Set(userCapabilities)

export type CapabilityDecision =
  | { allowed: true; capability: UserCapability }
  | { allowed: false; reason: "UNKNOWN_CAPABILITY" }

export function recognizeCapability(value: string): CapabilityDecision {
  return knownCapabilities.has(value)
    ? { allowed: true, capability: value as UserCapability }
    : { allowed: false, reason: "UNKNOWN_CAPABILITY" }
}

