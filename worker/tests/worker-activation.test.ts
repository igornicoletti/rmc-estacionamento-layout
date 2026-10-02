import { describe, expect, it, vi } from "vitest"
import { encodeSecret } from "../src/auth/worker-crypto"
import { WorkerOtp, parseOtpKeyring } from "../src/auth/worker-otp"
import { screenNewPassword } from "../src/auth/worker-password-screen"
import { WorkerProviderEnvelope } from "../src/auth/worker-provider-envelope"
import { WorkerActivationMfaProvider } from "../src/auth/worker-activation-mfa-provider"
import { jsonResponse } from "../src/http/worker-http"

const key = (value: number) => encodeSecret(new Uint8Array(32).fill(value))
const id = "10000000-0000-4000-8000-000000000001"
const binding = {
  journeyId: id, challengeId: "10000000-0000-4000-8000-000000000002",
  identityId: "10000000-0000-4000-8000-000000000003", generation: 1,
  expiresAt: "2026-10-02T15:00:00.000Z",
}
const signal = new AbortController().signal

describe("F06 activation cryptography", () => {
  it("generates eight decimal digits and binds verifier to every authority fact", async () => {
    const otp = new WorkerOtp({ currentVersion: 2, keys: { "1": key(1), "2": key(2) } }, [])
    const codes = Array.from({ length: 32 }, () => otp.generate())
    expect(codes.every((code) => /^\d{8}$/.test(code))).toBe(true)
    expect(new Set(codes).size).toBeGreaterThan(1)
    const original = (await otp.verifier("00123456", binding)).hash
    for (const changed of [
      { ...binding, journeyId: "10000000-0000-4000-8000-000000000004" },
      { ...binding, challengeId: "10000000-0000-4000-8000-000000000004" },
      { ...binding, identityId: null }, { ...binding, generation: 2 },
      { ...binding, expiresAt: "2026-10-02T15:00:01.000Z" },
    ]) expect((await otp.verifier("00123456", changed)).hash).not.toEqual(original)
    expect((await otp.verifier("00123456", binding, 1)).hash).not.toEqual(original)
    expect((await otp.verifier("00123457", binding)).hash).not.toEqual(original)
    await expect(otp.verifier("1234567", binding)).rejects.toThrow()
    await expect(otp.verifier("00123456", binding, 3)).rejects.toThrow()
  })

  it("rejects missing, reused and forbidden key bytes", () => {
    expect(() => new WorkerOtp({ currentVersion: 1, keys: { "2": key(2) } }, [])).toThrow()
    expect(() => new WorkerOtp({ currentVersion: 1, keys: { "1": key(1), "2": key(1) } }, [])).toThrow()
    expect(() => new WorkerOtp({ currentVersion: 1, keys: { "1": key(1) } }, [key(1)])).toThrow()
    expect(() => parseOtpKeyring("not-json", [])).toThrow()
  })
})

describe("F06 password compromise screen", () => {
  it("checks only the SHA-1 prefix, requests padding and denies a matching suffix", async () => {
    const password = "Long-Synthetic-Password-2026!"
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password)))
    const hash = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()
    const transport = vi.fn<typeof fetch>(() => Promise.resolve(new Response(`${hash.slice(5)}:3\r\n${"0".repeat(35)}:0\r\n`,
      { headers: { "Content-Type": "text/plain" } })))
    expect(await screenNewPassword(password, signal, transport)).toBe("BLOCKED")
    expect(transport.mock.calls[0][0]).toBe(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`)
    expect(JSON.stringify(transport.mock.calls)).not.toContain(password)
    expect(new Headers(transport.mock.calls[0][1]?.headers).get("Add-Padding")).toBe("true")
    expect(await screenNewPassword(password, signal, () => Promise.resolve(new Response(`${"0".repeat(35)}:0\n`,
      { headers: { "Content-Type": "text/plain" } })))).toBe("CLEAR")
  })

  it("fails closed on outage, redirects, malformed data and service-specific values", async () => {
    expect(await screenNewPassword("redemontecarlo2026", signal, vi.fn())).toBe("BLOCKED")
    expect(await screenNewPassword("Long-Synthetic-Password-2026!", signal,
      () => Promise.reject(new Error("offline")))).toBe("UNAVAILABLE")
    expect(await screenNewPassword("Long-Synthetic-Password-2026!", signal,
      () => Promise.resolve(new Response(null, { status: 302, headers: { Location: "https://example.com" } })))).toBe("UNAVAILABLE")
    expect(await screenNewPassword("Long-Synthetic-Password-2026!", signal,
      () => Promise.resolve(new Response("unexpected", { headers: { "Content-Type": "text/plain" } })))).toBe("UNAVAILABLE")
  })
})

it("encrypts the provider access token with identity, session and generation binding", async () => {
  const envelope = new WorkerProviderEnvelope(JSON.stringify({ currentVersion: 1, keys: { 1: key(9) } }), [key(8)])
  const binding = { identityId: id, sessionId: "10000000-0000-4000-8000-000000000004", generation: 1 }
  const token = "synthetic-provider-access-token-with-sufficient-length-0001"
  const sealed = await envelope.seal(token, binding)
  expect(sealed.ciphertext).not.toContain(token)
  expect(await envelope.open(sealed.ciphertext, sealed.keyVersion, binding)).toBe(token)
  await expect(envelope.open(sealed.ciphertext, sealed.keyVersion,
    { ...binding, generation: 2 })).rejects.toThrow()
  const tampered = `${sealed.ciphertext.slice(0, -2)}00`
  await expect(envelope.open(tampered, sealed.keyVersion, binding)).rejects.toThrow()
  expect(() => new WorkerProviderEnvelope(JSON.stringify({ currentVersion: 1, keys: { 1: key(8) } }), [key(8)])).toThrow()
})

it("sets both the journey and PREAUTH cookie independently", () => {
  const response = jsonResponse({ accepted: true }, id, [
    "__Host-rmc-journey=abc; Secure; HttpOnly; SameSite=Strict; Path=/",
    "__Host-rmc-preauth=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
  ], 202)
  expect(response.status).toBe(202)
  expect(response.headers.getSetCookie()).toEqual([
    "__Host-rmc-journey=abc; Secure; HttpOnly; SameSite=Strict; Path=/",
    "__Host-rmc-preauth=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
  ])
  expect(response.headers.get("Cache-Control")).toBe("no-store")
})

it("enrolls one owned TOTP factor and verifies the resulting AAL2 session", async () => {
  const claim = { identityId: id, providerSubject: "10000000-0000-4000-8000-000000000005",
    reservationCommand: "10000000-0000-4000-8000-000000000006",
    ownershipBinding: "10000000-0000-4000-8000-000000000007", generation: 1 }
  const factorId = "10000000-0000-4000-8000-000000000008"
  const user = { id: claim.providerSubject, email: `u-${claim.providerSubject}@auth.rmc.invalid`,
    app_metadata: { rmc_provisioning: { purpose: "PROVISION_IDENTITY", contractVersion: "1.1",
      commandId: claim.reservationCommand, identityId: claim.identityId,
      ownershipBinding: claim.ownershipBinding, identityGeneration: 1 } } }
  const payload = btoa(JSON.stringify({ sub: claim.providerSubject, aal: "aal2",
    exp: Math.floor(Date.now() / 1000) + 3600 }))
  const aal2Token = `${btoa("{}")}.${payload}.signature`
  let enrolled = false, verified = false
  const transport = vi.fn<typeof fetch>((input, init) => {
    const path = new URL(input instanceof Request ? input.url : input.toString()).pathname
    let result: unknown
    if (path === "/auth/v1/user") result = user
    else if (path.endsWith("/factors") && init?.method === "GET") result = enrolled
      ? [{ id: factorId, factor_type: "totp", status: verified ? "verified" : "unverified" }] : []
    else if (path === "/auth/v1/factors" && init?.method === "POST") {
      enrolled = true
      result = { id: factorId, type: "totp", totp: { secret: "ABCDEFGHIJKLMNOP",
        uri: "otpauth://totp/RMC?secret=ABCDEFGHIJKLMNOP" } }
    } else if (path.endsWith("/challenge")) result = { id: "10000000-0000-4000-8000-000000000009" }
    else if (path.endsWith("/verify")) {
      verified = true
      result = { access_token: aal2Token, expires_in: 3600 }
    } else throw new Error(`Unexpected path ${path}`)
    return Promise.resolve(Response.json(result))
  })
  const provider = new WorkerActivationMfaProvider("http://127.0.0.1:55321", key(11), transport)
  const initialToken = "synthetic-access-token-that-is-longer-than-forty-chars"
  expect((await provider.enroll(claim, initialToken, claim.reservationCommand, signal)).factorId).toBe(factorId)
  expect((await provider.verify(claim, initialToken, factorId, "123456", signal)).accessToken).toBe(aal2Token)
  expect(transport.mock.calls.some(([input]) => (input instanceof Request ? input.url : input.toString())
    .endsWith(`/admin/users/${claim.providerSubject}/factors`))).toBe(true)
  expect(JSON.stringify(transport.mock.calls)).not.toContain("ABCDEFGHIJKLMNOP")
})

it("resets only the activation-owned unverified factor", async () => {
  const claim = { identityId: id, providerSubject: "10000000-0000-4000-8000-000000000005",
    reservationCommand: "10000000-0000-4000-8000-000000000006",
    ownershipBinding: "10000000-0000-4000-8000-000000000007", generation: 1 }
  const factorId = "10000000-0000-4000-8000-000000000008"
  const user = { id: claim.providerSubject, email: `u-${claim.providerSubject}@auth.rmc.invalid`,
    app_metadata: { rmc_provisioning: { purpose: "PROVISION_IDENTITY", contractVersion: "1.1",
      commandId: claim.reservationCommand, identityId: claim.identityId,
      ownershipBinding: claim.ownershipBinding, identityGeneration: 1 } } }
  let status = "unverified", name = `RMC activation ${claim.reservationCommand}`
  let factorExists = true
  const transport = vi.fn<typeof fetch>((input, init) => {
    const path = new URL(input instanceof Request ? input.url : input.toString()).pathname
    if (path === "/auth/v1/user") return Promise.resolve(Response.json(user))
    if (path.endsWith("/factors") && init?.method === "GET") return Promise.resolve(Response.json(
      factorExists ? [{ id: factorId, factor_type: "totp", status, friendly_name: name }] : []))
    if (path.endsWith(`/factors/${factorId}`) && init?.method === "DELETE") {
      factorExists = false
      return Promise.resolve(Response.json({ id: factorId }))
    }
    throw new Error(`Unexpected path ${path}`)
  })
  const provider = new WorkerActivationMfaProvider("http://127.0.0.1:55321", key(11), transport)
  const token = "synthetic-access-token-that-is-longer-than-forty-chars"
  status = "verified"
  await expect(provider.resetUnverified(claim, token, claim.reservationCommand, factorId, signal)).rejects.toThrow()
  expect(factorExists).toBe(true)
  status = "unverified"; name = "unrelated factor"
  await expect(provider.resetUnverified(claim, token, claim.reservationCommand, factorId, signal)).rejects.toThrow()
  expect(factorExists).toBe(true)
  name = `RMC activation ${claim.reservationCommand}`
  await provider.resetUnverified(claim, token, claim.reservationCommand, factorId, signal)
  expect(factorExists).toBe(false)
})
