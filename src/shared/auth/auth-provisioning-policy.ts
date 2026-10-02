import { z } from "zod"
import { authRoleSchema, opaqueIdSchema } from "./auth-contracts"

const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const factsSchema = z.strictObject({
  policyVersion: z.literal("1.1"), capability: z.literal("users.create"),
  actor: z.strictObject({ id: opaqueIdSchema, role: authRoleSchema, lifecycle: z.literal("ACTIVE"), onboarding: z.literal("COMPLETE"), generation: positive }),
  session: z.strictObject({ identityId: opaqueIdSchema, generation: positive, identityGeneration: positive, purpose: z.literal("NORMAL"),
    assurance: z.literal("aal2"), revoked: z.literal(false), expiresAt: z.number().finite(), idleExpiresAt: z.number().finite() }),
  target: z.strictObject({ id: opaqueIdSchema, role: authRoleSchema, lifecycle: z.literal("PENDING"), onboarding: z.literal("ACTIVATION_REQUIRED"), generation: positive }),
  proof: z.strictObject({ verified: z.literal(true), oneTime: z.literal(true), identityId: opaqueIdSchema,
    sessionId: opaqueIdSchema, actorGeneration: positive, sessionGeneration: positive, targetGeneration: positive,
    commandId: opaqueIdSchema, intentHash: z.string().regex(/^[0-9a-f]{64}$/), verifiedAt: z.number().finite() }),
  sessionId: opaqueIdSchema, commandId: opaqueIdSchema, intentHash: z.string().regex(/^[0-9a-f]{64}$/),
  now: z.number().finite(), unitScopeVerified: z.boolean(), sameUnit: z.boolean(),
})

// Pure base gate, consuming verified server facts only. Never a browser authorization.
// Provider proof/one-time consumption and revalidation in the DB are mandatory separately.
export function authorizeProvisioning(input: unknown): "ALLOW" | "DENY" {
  const parsed = factsSchema.safeParse(input)
  if (!parsed.success) return "DENY"
  const f = parsed.data
  if (f.actor.id === f.target.id || f.session.identityId !== f.actor.id || f.session.identityGeneration !== f.actor.generation
    || f.proof.actorGeneration !== f.actor.generation
    || f.proof.sessionGeneration !== f.session.generation || f.proof.targetGeneration !== f.target.generation
    || f.session.expiresAt <= f.now || f.session.idleExpiresAt <= f.now
    || f.proof.identityId !== f.actor.id || f.proof.sessionId !== f.sessionId || f.proof.commandId !== f.commandId
    || f.proof.intentHash !== f.intentHash || f.now - f.proof.verifiedAt > 300000 || f.proof.verifiedAt - f.now > 30000) return "DENY"
  const inferiors: Readonly<Record<string, readonly string[]>> = { S: ["A", "R", "M", "O"], A: ["R", "M", "O"], M: ["O"] }
  if (!inferiors[f.actor.role]?.includes(f.target.role)) return "DENY"
  if ((f.target.role === "M" || f.target.role === "O" || f.actor.role === "M") && !f.unitScopeVerified) return "DENY"
  if (f.actor.role === "M" && !f.sameUnit) return "DENY"
  return "ALLOW"
}
