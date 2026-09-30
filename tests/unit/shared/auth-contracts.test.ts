import { describe, expect, it } from "vitest"

import {
  authenticatedSessionSchema,
  canTransitionLifecycle,
  canTransitionOnboarding,
  corporateEmailSchema,
  cpfSchema,
  e164PhoneSchema,
  loginCommandSchema,
  otpCommandSchema,
  sessionSnapshotSchema,
} from "@/shared/auth/auth-index"

const validSession = {
  state: "authenticated",
  contractVersion: "1.0",
  contextId: "context_123456789",
  identityId: "identity_12345678",
  displayName: "Usuária",
  role: "A",
  scope: { kind: "GLOBAL" },
  capabilities: ["users.read"],
  assurance: "aal2",
  freshUntil: "2026-09-30T14:05:00-03:00",
  expiresAt: "2026-10-01T02:00:00-03:00",
  idleExpiresAt: "2026-09-30T14:30:00-03:00",
  serverTime: "2026-09-30T14:00:00-03:00",
  policyVersion: "auth-v1",
  contextVersion: 1,
} as const

describe("contratos runtime de Auth", () => {
  it("aceita a projeção pública estrita e rejeita campos inesperados", () => {
    expect(authenticatedSessionSchema.parse(validSession)).toEqual(validSession)
    expect(
      authenticatedSessionSchema.safeParse({ ...validSession, accessToken: "secret" })
        .success,
    ).toBe(false)
  })

  it("rejeita null, shape desconhecido, capability e assurance não canônicas (T03)", () => {
    expect(sessionSnapshotSchema.safeParse(null).success).toBe(false)
    expect(sessionSnapshotSchema.safeParse({ state: "authenticated" }).success).toBe(false)
    expect(
      authenticatedSessionSchema.safeParse({
        ...validSession,
        capabilities: ["users.future"],
      }).success,
    ).toBe(false)
    expect(
      authenticatedSessionSchema.safeParse({
        ...validSession,
        assurance: "fresh-aal2",
      }).success,
    ).toBe(false)
  })

  it("permite apenas transições canônicas e mantém dimensões separadas", () => {
    expect(canTransitionLifecycle("PENDING", "ACTIVE")).toBe(true)
    expect(canTransitionLifecycle("DELETED", "ACTIVE")).toBe(false)
    expect(canTransitionOnboarding("PASSWORD_REQUIRED", "SECURITY_SETUP")).toBe(true)
    expect(canTransitionOnboarding("COMPLETE", "ACTIVATION_REQUIRED")).toBe(false)
  })

  it("valida identificadores humanos canônicos sem coerção", () => {
    expect(cpfSchema.safeParse("52998224725").success).toBe(true)
    expect(cpfSchema.safeParse("529.982.247-25").success).toBe(false)
    expect(cpfSchema.safeParse("11111111111").success).toBe(false)
    expect(e164PhoneSchema.safeParse("+5511999999999").success).toBe(true)
    expect(corporateEmailSchema.safeParse("user@redemontecarlo.com.br").success).toBe(true)
    expect(corporateEmailSchema.safeParse("user@example.com").success).toBe(false)
  })

  it("rejeita OTP fora do formato ou comando com campo extra", () => {
    const command = {
      challengeId: "challenge_123456789",
      otp: "12345678",
      commandId: "command_1234567890",
    }
    expect(otpCommandSchema.safeParse(command).success).toBe(true)
    expect(otpCommandSchema.safeParse({ ...command, otp: "123456" }).success).toBe(false)
    expect(otpCommandSchema.safeParse({ ...command, role: "S" }).success).toBe(false)
  })

  it("mantém login como comando fechado", () => {
    const command = {
      cpf: "52998224725",
      password: "  senha não normalizada  ",
      commandId: "command_1234567890",
    }
    expect(loginCommandSchema.safeParse(command).success).toBe(true)
    expect(loginCommandSchema.safeParse({ ...command, assurance: "aal2" }).success).toBe(false)
  })
})
