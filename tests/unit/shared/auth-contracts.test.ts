import { describe, expect, it } from "vitest"

import {
  AUTH_POLICY_VERSION,
  authPolicy,
  authenticatedSessionSchema,
  canTransitionLifecycle,
  canTransitionOnboarding,
  corporateEmailSchema,
  cpfSchema,
  e164PhoneSchema,
  loginCommandSchema,
  otpCommandSchema,
  restrictedSessionSchema,
  sessionSnapshotSchema,
} from "@/shared/auth"

const validPublicSession = {
  contractVersion: "1.0",
  contextId: "context_123456789",
  identityId: "identity_12345678",
  displayName: "Usuária",
  role: "A",
  scope: { kind: "GLOBAL" },
  capabilities: ["users.read"],
  assurance: "aal2",
  expiresAt: "2026-10-01T02:00:00-03:00",
  idleExpiresAt: "2026-09-30T14:30:00-03:00",
  serverTime: "2026-09-30T14:00:00-03:00",
  policyVersion: AUTH_POLICY_VERSION,
  contextVersion: 1,
} as const

const validSession = {
  kind: "authenticated",
  session: validPublicSession,
} as const

describe("contratos runtime de Auth", () => {
  it("aceita a projeção pública estrita e rejeita campos inesperados", () => {
    expect(authenticatedSessionSchema.parse(validSession)).toEqual(validSession)
    expect(
      authenticatedSessionSchema.safeParse({
        ...validSession,
        session: { ...validPublicSession, accessToken: "secret" },
      }).success,
    ).toBe(false)
    expect(
      authenticatedSessionSchema.safeParse({
        ...validSession,
        session: {
          ...validPublicSession,
          freshUntil: "2026-09-30T14:05:00-03:00",
        },
      }).success,
    ).toBe(false)
  })

  it("rejeita null, shape desconhecido, capability e assurance não canônicas (T03)", () => {
    expect(sessionSnapshotSchema.safeParse(null).success).toBe(false)
    expect(sessionSnapshotSchema.safeParse({ kind: "authenticated" }).success).toBe(false)
    expect(
      authenticatedSessionSchema.safeParse({
        ...validSession,
        session: {
          ...validPublicSession,
          capabilities: ["users.future"],
        },
      }).success,
    ).toBe(false)
    expect(
      authenticatedSessionSchema.safeParse({
        ...validSession,
        session: { ...validPublicSession, assurance: "fresh-aal2" },
      }).success,
    ).toBe(false)
  })

  it("fecha as etapas restricted por jornada e rejeita combinações cruzadas", () => {
    const base = {
      kind: "restricted",
      contractVersion: "1.0",
      contextId: "context_123456789",
      expiresAt: "2026-09-30T14:30:00-03:00",
      serverTime: "2026-09-30T14:00:00-03:00",
    } as const

    expect(
      restrictedSessionSchema.safeParse({
        ...base,
        journey: "activation",
        step: "SECURITY_SETUP",
      }).success,
    ).toBe(true)
    expect(
      restrictedSessionSchema.safeParse({
        ...base,
        journey: "mfa",
        step: "SECURITY_SETUP",
      }).success,
    ).toBe(false)
    expect(
      restrictedSessionSchema.safeParse({
        ...base,
        journey: "recovery",
        step: "UNKNOWN_STEP",
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

  it("mantém a política central versionada e os limites canônicos de F01", () => {
    expect(authPolicy).toMatchObject({
      version: "auth-v1",
      otpDigits: 8,
      freshStepUpMs: 300_000,
      futureClockSkewMs: 30_000,
      authBodyBytes: 8_192,
      passwordMinCodePoints: 15,
      passwordMaxCodePoints: 64,
      passwordMaxUtf8Bytes: 72,
    })
  })
})
