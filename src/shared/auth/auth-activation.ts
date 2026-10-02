import { z } from "zod"
import { AUTH_CONTRACT_VERSION, authRoleSchema, opaqueIdSchema } from "./auth-contracts"
import { authSecretSchema } from "./auth-http-contracts"
import { authPolicy } from "./auth-policy"

export const activationRequestSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  // Syntactically bounded invalid CPF values take the decoy path as well.
  cpf: z.string().max(32),
  commandId: opaqueIdSchema,
})

export const activationVerifySchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  challengeId: opaqueIdSchema,
  code: z.string().regex(new RegExp(`^\\d{${authPolicy.otpDigits}}$`)),
  commandId: opaqueIdSchema,
})

export const activationCancelSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  commandId: opaqueIdSchema,
})

export const activationPasswordSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  // Validate limits after NFC normalization; raw HTTP bytes are bounded by the BFF.
  password: z.string(),
  commandId: opaqueIdSchema,
})

export const activationCompleteSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  commandId: opaqueIdSchema,
})

export const activationTotpEnrollSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  commandId: opaqueIdSchema,
})

export const activationTotpVerifySchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  commandId: opaqueIdSchema,
  code: z.string().regex(/^\d{6}$/),
})

export const activationAcceptedSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  challengeId: opaqueIdSchema,
  expiresAt: z.iso.datetime({ offset: true }),
  csrfToken: authSecretSchema,
})

export const activationBootstrapSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  step: z.literal("PASSWORD_REQUIRED"),
  csrfToken: authSecretSchema,
})

export const activationSecuritySetupSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  step: z.literal("SECURITY_SETUP"),
})

export const activationCancelResponseSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  step: z.literal("RESTART_REQUIRED"),
})

export const activationTotpSecretSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  factorId: opaqueIdSchema,
  secret: z.string().regex(/^[A-Z2-7]{16,128}$/),
  uri: z.string().min(20).max(1024),
})

export const activationCompleteResponseSchema = z.strictObject({
  contractVersion: z.literal(AUTH_CONTRACT_VERSION),
  step: z.literal("COMPLETE"),
  role: authRoleSchema,
  contextVersion: z.number().int().positive(),
  expiresAt: z.iso.datetime({ offset: true }),
  csrfToken: authSecretSchema,
})
