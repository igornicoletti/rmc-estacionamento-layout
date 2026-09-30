import type { Lifecycle, Onboarding } from "./auth-contracts"

const lifecycleTransitions: Readonly<Record<Lifecycle, readonly Lifecycle[]>> = {
  PENDING: ["ACTIVE", "DELETED"],
  ACTIVE: ["SUSPENDED", "BLOCKED", "DISABLED", "DELETED"],
  SUSPENDED: ["ACTIVE", "DELETED"],
  BLOCKED: ["ACTIVE", "DELETED"],
  DISABLED: ["ACTIVE", "DELETED"],
  DELETED: [],
}

const onboardingTransitions: Readonly<Record<Onboarding, readonly Onboarding[]>> = {
  ACTIVATION_REQUIRED: ["PASSWORD_REQUIRED"],
  PASSWORD_REQUIRED: ["SECURITY_SETUP"],
  SECURITY_SETUP: ["COMPLETE"],
  COMPLETE: [],
}

export const canTransitionLifecycle = (from: Lifecycle, to: Lifecycle) =>
  lifecycleTransitions[from].includes(to)

export const canTransitionOnboarding = (from: Onboarding, to: Onboarding) =>
  onboardingTransitions[from].includes(to)

