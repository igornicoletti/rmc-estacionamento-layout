import { describe, expect, it } from "vitest"

import {
  evaluateRouteAccess,
  evaluateRouteAccessPolicies,
  type RouteAccessPolicy,
} from "@/features/auth/access/auth-access-policy"
import type { SessionSnapshot } from "@/features/auth/contracts/auth-types"

const authenticated = {
  status: "authenticated",
  session: {
    assurance: "aal2",
    capabilities: ["users.read"],
    identity: { displayName: "Usuária", id: "user-1" },
  },
} satisfies SessionSnapshot

describe("evaluateRouteAccess", () => {
  it.each([
    [{ status: "bootstrapping" }, { authentication: "either" }, "pending"],
    [{ status: "unavailable" }, { authentication: "either" }, "deny"],
    [{ status: "anonymous" }, undefined, "deny"],
    [{ status: "anonymous" }, { authentication: "either" }, "allow"],
    [{ status: "anonymous" }, { authentication: "required" }, "deny"],
    [authenticated, { authentication: "anonymous-only" }, "redirect"],
  ] satisfies [SessionSnapshot, RouteAccessPolicy | undefined, string][])(
    "avalia %# de forma fail-closed",
    (snapshot, policy, kind) => {
      expect(evaluateRouteAccess(snapshot, policy).kind).toBe(kind)
    },
  )

  it("exige todas as capabilities declaradas", () => {
    expect(
      evaluateRouteAccess(authenticated, {
        authentication: "required",
        capabilities: ["users.read", "users.create"],
      }),
    ).toEqual({ kind: "deny" })
  })

  it("não trata freshness transacional como estado global da rota", () => {
    const unsupportedFreshnessPolicy = {
      authentication: "required",
      fresh: true,
    } as unknown as RouteAccessPolicy

    expect(evaluateRouteAccess(authenticated, unsupportedFreshnessPolicy)).toEqual({
      kind: "deny",
    })
  })

  it("nega políticas desconhecidas, contraditórias ou com propriedades extras", () => {
    const malformedAuthentication = {
      authentication: "unexpected",
    } as unknown as RouteAccessPolicy
    const contradictoryAnonymousPolicy = {
      authentication: "anonymous-only",
      assurance: "aal2",
    } as unknown as RouteAccessPolicy
    const unknownCapability = {
      authentication: "required",
      capabilities: ["users.future"],
    } as unknown as RouteAccessPolicy
    const unknownProperty = {
      authentication: "required",
      typoCapability: ["users.read"],
    } as unknown as RouteAccessPolicy

    expect(evaluateRouteAccess(authenticated, malformedAuthentication)).toEqual(
      { kind: "deny" },
    )
    expect(
      evaluateRouteAccess(
        { status: "anonymous" },
        contradictoryAnonymousPolicy,
      ),
    ).toEqual({ kind: "deny" })
    expect(evaluateRouteAccess(authenticated, unknownCapability)).toEqual({
      kind: "deny",
    })
    expect(evaluateRouteAccess(authenticated, unknownProperty)).toEqual({
      kind: "deny",
    })
  })

  it("só redireciona para autenticação quando o destino é configurado", () => {
    const snapshot = { status: "anonymous" } satisfies SessionSnapshot
    const policy = { authentication: "required" } satisfies RouteAccessPolicy

    expect(evaluateRouteAccess(snapshot, policy)).toEqual({ kind: "deny" })
    expect(
      evaluateRouteAccess(snapshot, policy, { authenticationPath: "/login" }),
    ).toEqual({ kind: "redirect", to: "/login" })
  })

  it("compõe as políticas da hierarquia sem permitir que o filho enfraqueça o pai", () => {
    const anonymous = { status: "anonymous" } satisfies SessionSnapshot

    expect(
      evaluateRouteAccessPolicies(
        anonymous,
        [{ authentication: "required" }, { authentication: "either" }],
        { authenticationPath: "/login" },
      ),
    ).toEqual({ kind: "redirect", to: "/login" })

    expect(
      evaluateRouteAccessPolicies(authenticated, [
        {
          authentication: "required",
          capabilities: ["users.read"],
        },
        {
          authentication: "required",
          capabilities: ["users.create"],
        },
      ]),
    ).toEqual({ kind: "deny" })
  })

  it("nega uma hierarquia sem política de acesso", () => {
    expect(evaluateRouteAccessPolicies(authenticated, [])).toEqual({
      kind: "deny",
    })
  })
})
