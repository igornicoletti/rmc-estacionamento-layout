import assert from "node:assert/strict"
import { createHmac, randomBytes, randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { nodeCli, runProcess } from "../../scripts/validation/validation-process.mjs"

const localUrl = "http://127.0.0.1:55321"
const [cli, prefix] = nodeCli("supabase/dist/supabase.js")
const { stdout } = await runProcess(cli, [...prefix, "status", "--output", "json"], { capture: true, timeout: 30000 })
const status = JSON.parse(stdout)
assert.equal(status.API_URL, localUrl, `Unexpected local status keys: ${Object.keys(status).join(",")}`)
const key = status.SERVICE_ROLE_KEY
assert.equal(typeof key, "string")

const client = createClient(localUrl, key, { auth: {
  persistSession: false, autoRefreshToken: false, detectSessionInUrl: false,
} })
const subject = randomUUID()
const email = `u-${subject}@auth.rmc.invalid`
const password = `Synthetic-Activation-${randomBytes(24).toString("hex")}`
let created = false
let unexpectedSignup = null
async function auth(path, method, token, body) {
  const response = await fetch(`${localUrl}${path}`, { method, redirect: "manual",
    headers: { apikey: key, Authorization: `Bearer ${token}`, Accept: "application/json",
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}) },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  })
  assert.ok(response.status >= 200 && response.status < 300, `Auth ${path} failed with ${response.status}`)
  return response.json()
}
function decodeBase32(text) {
  let bits = 0, value = 0
  const output = []
  for (const char of text.replaceAll("=", "").toUpperCase()) {
    const digit = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(char)
    assert.ok(digit >= 0)
    value = (value << 5) | digit
    bits += 5
    if (bits >= 8) { bits -= 8; output.push((value >>> bits) & 255) }
  }
  return Buffer.from(output)
}
function totp(secret, time) {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 30000)))
  const digest = createHmac("sha1", decodeBase32(secret)).update(counter).digest()
  const offset = digest[digest.length - 1] & 15
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
  return String(value).padStart(6, "0")
}
try {
  const signup = await client.auth.signUp({
    email: `unexpected-${randomUUID()}@auth.rmc.invalid`, password: randomBytes(32).toString("base64url"),
  })
  unexpectedSignup = signup.data.user?.id ?? null
  assert.ok(signup.error, "public sign-up must remain disabled")
  assert.equal(unexpectedSignup, null)
  const createdUser = await client.auth.admin.createUser({ id: subject, email,
    password: randomBytes(32).toString("base64url"), email_confirm: true })
  assert.ifError(createdUser.error)
  assert.equal(createdUser.data.user?.id, subject)
  created = true
  const before = await client.auth.signInWithPassword({ email, password })
  assert.equal(before.error?.code, "invalid_credentials")
  const updated = await client.auth.admin.updateUserById(subject, { password })
  assert.ifError(updated.error)
  assert.equal(updated.data.user?.id, subject)
  const signed = await client.auth.signInWithPassword({ email, password })
  assert.ifError(signed.error)
  assert.equal(signed.data.user?.id, subject)
  assert.ok(signed.data.session?.access_token)
  const beforeMfaUser = await auth("/auth/v1/user", "GET", signed.data.session.access_token)
  assert.equal(beforeMfaUser.id, subject)
  const adminFactorsBefore = await client.auth.admin.mfa.listFactors({ userId: subject })
  assert.ifError(adminFactorsBefore.error)
  assert.deepEqual(adminFactorsBefore.data.factors, [])
  const enrolled = await auth("/auth/v1/factors", "POST", signed.data.session.access_token,
    { factor_type: "totp", friendly_name: "RMC" })
  assert.ok(enrolled.id)
  assert.equal(enrolled.type, "totp")
  assert.ok(enrolled.totp?.secret)
  assert.match(enrolled.totp.secret, /^[A-Z2-7]{16,128}$/)
  assert.equal(new URL(enrolled.totp.uri).searchParams.get("secret"), enrolled.totp.secret)
  const challenged = await auth(`/auth/v1/factors/${enrolled.id}/challenge`, "POST",
    signed.data.session.access_token, { factorId: enrolled.id })
  assert.ok(challenged.id)
  const verified = await auth(`/auth/v1/factors/${enrolled.id}/verify`, "POST",
    signed.data.session.access_token,
    { challenge_id: challenged.id, code: totp(enrolled.totp.secret, Date.now()) })
  assert.ok(verified.access_token)
  assert.ok(Number.isInteger(verified.expires_in) && verified.expires_in >= 300)
  const jwt = JSON.parse(Buffer.from(verified.access_token.split(".")[1], "base64url").toString("utf8"))
  assert.equal(jwt.sub, subject)
  assert.equal(jwt.aal, "aal2")
  const afterMfaUser = await auth("/auth/v1/user", "GET", verified.access_token)
  assert.equal(afterMfaUser.id, subject)
  const adminFactorsAfter = await client.auth.admin.mfa.listFactors({ userId: subject })
  assert.ifError(adminFactorsAfter.error)
  assert.equal(adminFactorsAfter.data.factors.length, 1)
  assert.equal(adminFactorsAfter.data.factors[0].id, enrolled.id)
  assert.equal(adminFactorsAfter.data.factors[0].factor_type, "totp")
  assert.equal(adminFactorsAfter.data.factors[0].status, "verified")
  console.log("Local provider password proof and single-TOTP enrollment/verification: PASS")
} finally {
  if (unexpectedSignup) {
    const removed = await client.auth.admin.deleteUser(unexpectedSignup)
    assert.ifError(removed.error)
  }
  if (created) {
    await client.auth.signOut().catch(() => {})
    const deleted = await client.auth.admin.deleteUser(subject)
    assert.ifError(deleted.error)
  }
}
