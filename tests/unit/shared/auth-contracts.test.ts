import { describe, expect, expectTypeOf, it } from "vitest"

import {
  authScopeSchema,
  authenticatedSessionSchema,
  externalUnitKeySchema,
  opaqueIdSchema,
  sessionSnapshotSchema,
  restrictedSessionSchema,
  type AuthScope,
  type AuthorityPurpose,
} from "@/shared/auth/auth-contracts"
import {
  corporateEmailSchema,
  cpfSchema,
  e164PhoneSchema,
  loginCommandSchema,
  otpCommandSchema,
} from "@/shared/auth/auth-identity-contracts"
import { AUTH_POLICY_VERSION, authPolicy } from "@/shared/auth/auth-policy"
import {
  evaluateLifecycleTransition,
  evaluateOnboardingTransition,
} from "@/shared/auth/auth-transitions"

const contextId = "11111111-1111-4111-8111-111111111111"
const identityId = "22222222-2222-4222-8222-222222222222"
const commandId = "33333333-3333-4333-8333-333333333333"
const challengeId = "44444444-4444-4444-8444-444444444444"

const validPublicSession = {
  contractVersion: "1.0",
  contextId,
  identityId,
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
  it("mantém fechado o tipo canônico de authority purpose", () => {
    expectTypeOf<AuthorityPurpose>().toEqualTypeOf<
      "PREAUTH" | "MFA_PENDING" | "BOOTSTRAP" | "RECOVERY" | "NORMAL"
    >()
  })

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
      contextId,
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

  it("totaliza transições, exige fatos e falha fechado para estados desconhecidos", () => {
    expect(
      evaluateLifecycleTransition({
        from: null,
        to: "PENDING",
        facts: { provisioningAuthorized: true, consistencyProved: true },
      }),
    ).toEqual({ allowed: true })
    expect(
      evaluateLifecycleTransition({
        from: "PENDING",
        to: "ACTIVE",
        facts: {
          onboardingComplete: true,
          proofsComplete: true,
          assignmentEligible: true,
        },
      }),
    ).toEqual({ allowed: true })
    expect(
      evaluateLifecycleTransition({ from: "PENDING", to: "ACTIVE" }),
    ).toEqual({ allowed: false, reason: "FACTS_REQUIRED" })
    expect(
      evaluateLifecycleTransition({ from: "DELETED", to: "ACTIVE" }),
    ).toEqual({ allowed: false, reason: "TRANSITION_NOT_ALLOWED" })
    expect(
      evaluateLifecycleTransition({ from: "UNKNOWN", to: "ACTIVE" }),
    ).toEqual({ allowed: false, reason: "UNKNOWN_STATE" })
    expect(
      evaluateLifecycleTransition({ from: "ACTIVE", to: "UNKNOWN" }),
    ).toEqual({ allowed: false, reason: "UNKNOWN_STATE" })
    expect(
      evaluateOnboardingTransition({
        from: "PASSWORD_REQUIRED",
        to: "SECURITY_SETUP",
        facts: { passwordCommitProved: true },
      }),
    ).toEqual({ allowed: true })
    expect(evaluateOnboardingTransition(null)).toEqual({
      allowed: false,
      reason: "INVALID_INPUT",
    })
    expect(
      evaluateOnboardingTransition({
        from: "ACTIVATION_REQUIRED",
        to: "PASSWORD_REQUIRED",
      }),
    ).toEqual({ allowed: false, reason: "FACTS_REQUIRED" })
  })

  it("formaliza IDs opacos internos como UUID v4 sem aceitar segredos arbitrários", () => {
    expect(opaqueIdSchema.safeParse(contextId).success).toBe(true)
    expect(opaqueIdSchema.safeParse("opaque-id-123").success).toBe(false)
    expect(
      opaqueIdSchema.safeParse("11111111-1111-5111-8111-111111111111").success,
    ).toBe(false)
  })

  it("expõe scope estrito com chave externa opaca, sem presumir UUID", () => {
    expectTypeOf<AuthScope>().toEqualTypeOf<
      { kind: "GLOBAL" } | { kind: "UNIT"; unitId: string }
    >()
    expect(authScopeSchema.safeParse({ kind: "GLOBAL" }).success).toBe(true)
    expect(
      authScopeSchema.safeParse({ kind: "UNIT", unitId: "12345" }).success,
    ).toBe(true)
    expect(externalUnitKeySchema.safeParse(" 12345").success).toBe(false)
    expect(
      authScopeSchema.safeParse({ kind: "UNIT", unitId: "12345", role: "M" })
        .success,
    ).toBe(false)
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
      challengeId,
      otp: "12345678",
      commandId,
    }
    expect(otpCommandSchema.safeParse(command).success).toBe(true)
    expect(otpCommandSchema.safeParse({ ...command, otp: "123456" }).success).toBe(false)
    expect(otpCommandSchema.safeParse({ ...command, role: "S" }).success).toBe(false)
  })

  it("mantém login como comando fechado", () => {
    const command = {
      cpf: "52998224725",
      password: "  senha não normalizada  ",
      commandId,
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
