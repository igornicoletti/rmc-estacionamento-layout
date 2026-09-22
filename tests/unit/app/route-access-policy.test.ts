import { describe, expect, it } from "vitest"

import {
  evaluateRouteAccess,
  type RouteAccessPolicy,
} from "@/app/routing/route-access"
import type { SessionSnapshot } from "@/app/session/session-types"

const authenticated = {
  status: "authenticated",
  session: {
    assurance: "aal2",
    capabilities: ["users:read"],
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
        capabilities: ["users:read", "users:write"],
      }),
    ).toEqual({ kind: "deny" })
  })

  it("respeita a hierarquia de assurance", () => {
    expect(
      evaluateRouteAccess(authenticated, {
        authentication: "required",
        assurance: "fresh-aal2",
      }),
    ).toEqual({ kind: "deny" })
  })

  it("nega políticas desconhecidas em runtime", () => {
    const malformedPolicy = {
      authentication: "unexpected",
    } as unknown as RouteAccessPolicy

    expect(evaluateRouteAccess(authenticated, malformedPolicy)).toEqual({
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
})
