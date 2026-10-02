import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { randomBytes, randomUUID } from "node:crypto"
import { request as httpsRequest } from "node:https"
import { createServer } from "node:net"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { runProcess } from "../../scripts/validation/validation-process.mjs"
import { container } from "../../scripts/auth-db/auth-db-gate.mjs"

const origin = "https://localhost:8787"
const key = () => randomBytes(32).toString("base64url")
const sql = async (statement) => (await runProcess("docker", ["exec", container, "psql", "-U", "postgres",
  "-d", "postgres", "-AtXq", "-v", "ON_ERROR_STOP=1", "-c", statement], { capture: true })).stdout.trim()

function probe(path, method = "GET", headers = {}, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body)
    const req = httpsRequest(origin + path, { method, rejectUnauthorized: false, timeout: 10_000,
      headers: { ...headers, ...(payload ? { "Content-Type": "application/json" } : {}) } }, (res) => {
      const chunks = []; let size = 0
      res.on("data", (chunk) => { size += chunk.length
        if (size > 65536) res.destroy(new Error("F06 response too large")); else chunks.push(chunk) })
      res.on("error", reject)
      res.on("end", () => { try { resolve({ status: res.statusCode, headers: res.headers,
        body: JSON.parse(Buffer.concat(chunks).toString("utf8")) }) } catch (error) { reject(error) } })
    })
    req.on("timeout", () => req.destroy(new Error("F06 HTTP timeout")))
    req.on("error", reject)
    req.end(payload ?? undefined)
  })
}

export async function activationHttpIntegration(results = [], signal) {
  const startedAt = new Date().toISOString()
  const require = createRequire(import.meta.url)
  const cli = join(dirname(require.resolve("wrangler/package.json")), "bin", "wrangler.js")
  const status = JSON.parse((await runProcess(process.execPath,
    ["node_modules/supabase/dist/supabase.js", "status", "--output", "json"], { capture: true })).stdout)
  assert.equal(status.API_URL, "http://127.0.0.1:55321")
  const free = createServer()
  await new Promise((resolve, reject) => { free.once("error", reject); free.listen(8787, "127.0.0.1", resolve) })
  await new Promise((resolve) => free.close(resolve))
  const context = { currentVersion: 1, versions: { 1: { cookie: key(), csrf: key(), rate: key() } } }
  const delivery = { currentVersion: 1, delivery: { 1: key() }, phone: { 1: key() },
    receipt: { currentVersion: 1, keys: { 1: key() } } }
  const cpf = { currentSourceVersion: 1, source: { 1: key() }, lookup: { 1: key() } }
  const otp = { currentVersion: 1, keys: { 1: key() } }
  const provider = { currentVersion: 1, keys: { 1: key() } }
  const child = spawn(process.execPath, [cli, "dev", "--config", "worker/wrangler.jsonc", "--local",
    "--ip", "127.0.0.1", "--port", "8787", "--local-protocol", "https",
    "--var", "ENVIRONMENT:LOCAL_PRODUCTION_LIKE", "--var", "AUTH_STAGE:disabled",
    "--var", "BFF_CONTEXT_ENABLED:true", "--var", "BFF_DELIVERY_ENABLED:true",
    "--var", "BFF_ACTIVATION_ENABLED:true", "--var", `CANONICAL_ORIGIN:${origin}`,
    "--var", `SUPABASE_URL:${status.API_URL}`, "--var", "SMS_GATEWAY_URL:http://127.0.0.1:5791"], {
    windowsHide: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, CLOUDFLARE_SEND_METRICS: "false", SUPABASE_SECRET_KEY: status.SERVICE_ROLE_KEY,
      AUTH_KEYRING: JSON.stringify(context), DELIVERY_KEYRING: JSON.stringify(delivery),
      CPF_KEYRING: JSON.stringify(cpf), OTP_KEYRING: JSON.stringify(otp),
      PROVIDER_KEYRING: JSON.stringify(provider), SMS_GATEWAY_TOKEN: key() },
  })
  let exited = false, bytes = 0, parentId, journeyId, requestId, resendId, cancelRequestId
  child.stdout.on("data", (chunk) => { bytes += chunk.length })
  child.stderr.on("data", (chunk) => { bytes += chunk.length })
  child.on("exit", () => { exited = true }); child.on("error", () => { exited = true })
  const terminate = () => { if (!child.pid || exited) return
    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"],
        { windowsHide: true, stdio: "ignore" })
      killer.on("error", () => child.kill())
    } else { try { process.kill(-child.pid, "SIGKILL") } catch { child.kill() } }
  }
  signal?.addEventListener("abort", terminate, { once: true })
  try {
    const deadline = Date.now() + 60_000
    while (true) {
      signal?.throwIfAborted()
      if (exited || bytes > 1048576 || Date.now() > deadline) throw new Error("F06 Worker startup failed")
      try { if ((await probe("/api/health")).status === 200) break } catch { /* readiness */ }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    const preauth = await probe("/api/auth/context", "GET", { "Sec-Fetch-Site": "same-origin" })
    assert.equal(preauth.status, 200)
    parentId = preauth.body.contextId
    const initialCookie = preauth.headers["set-cookie"][0].split(";")[0]
    const initialCsrf = preauth.body.csrfToken
    journeyId = randomUUID(); requestId = journeyId
    const mutation = { Origin: origin, Cookie: initialCookie, "X-RMC-CSRF-Token": initialCsrf }
    const requestBody = { contractVersion: "1.1", cpf: "00000000000", commandId: journeyId }
    const accepted = await probe("/api/auth/activation/request", "POST", mutation, requestBody)
    assert.equal(accepted.status, 202)
    assert.equal(accepted.body.contractVersion, "1.1")
    assert.match(accepted.headers["set-cookie"][0], /Max-Age=1[0-9]{3}/)
    const journeyCookie = accepted.headers["set-cookie"][0].split(";")[0]
    const restricted = { Cookie: journeyCookie, "X-RMC-CSRF-Token": accepted.body.csrfToken }
    const statusBefore = await probe("/api/auth/journey", "GET", restricted)
    assert.equal(statusBefore.status, 200)
    assert.equal(statusBefore.body.step, "OTP_REQUIRED")
    assert.equal(statusBefore.body.challengeId, accepted.body.challengeId)
    const oldChallenge = accepted.body.challengeId
    const replay = await probe("/api/auth/activation/request", "POST", mutation, requestBody)
    assert.equal(replay.status, 202)
    assert.equal(replay.body.challengeId, oldChallenge)
    await sql(`update rmc_auth_private.activation_requests set created_at=clock_timestamp()-interval '61 seconds'
      where command_id='${journeyId}'`)
    resendId = randomUUID()
    const resend = await probe("/api/auth/activation/resend", "POST", { ...restricted, Origin: origin },
      { contractVersion: "1.1", commandId: resendId })
    assert.equal(resend.status, 202)
    assert.notEqual(resend.body.challengeId, oldChallenge)
    assert.equal(await sql(`select generation from rmc_auth_private.challenges where id='${resend.body.challengeId}'`), "2")
    assert.equal(await sql(`select count(*) from rmc_auth_private.delivery_outbox where challenge_id in
      ('${oldChallenge}','${resend.body.challengeId}')`), "0")
    const old = await probe("/api/auth/activation/verify", "POST", { ...restricted, Origin: origin },
      { contractVersion: "1.1", commandId: randomUUID(), challengeId: oldChallenge, code: "00000000" })
    assert.equal(old.body.code, "AUTH_CREDENTIALS_INVALID")
    const replayResend = await probe("/api/auth/activation/resend", "POST", { ...restricted, Origin: origin },
      { contractVersion: "1.1", commandId: resendId })
    assert.equal(replayResend.status, 202)
    assert.equal(replayResend.body.challengeId, resend.body.challengeId)
    const current = await probe("/api/auth/journey", "GET", restricted)
    assert.equal(current.body.challengeId, resend.body.challengeId)
    const cancelled = await probe("/api/auth/journey/cancel", "POST", { ...restricted, Origin: origin },
      { contractVersion: "1.1", commandId: randomUUID() })
    cancelRequestId = cancelled.headers["x-request-id"]
    assert.equal(cancelled.status, 200)
    assert.equal(cancelled.body.step, "RESTART_REQUIRED")
    assert.equal((await probe("/api/auth/journey", "GET", restricted)).body.code, "AUTH_CSRF_INVALID")
    assert.equal(await sql(`select count(*) from rmc_auth_private.functional_sessions`), "0")
    results.push({ label: "F06 HTTPS/DB journey", startedAt,
      finishedAt: new Date().toISOString(), exitCode: 0 })
    console.log("F06 HTTPS/DB decoy journey, replay, resend generation, stale OTP and cancel: PASS")
  } catch {
    results.push({ label: "F06 HTTPS/DB journey", startedAt,
      finishedAt: new Date().toISOString(), exitCode: 1 })
    throw new Error("F06 HTTPS integration failed; payload/secrets suppressed")
  } finally {
    signal?.removeEventListener("abort", terminate)
    terminate()
    if (child.pid && !exited) await runProcess("taskkill", ["/pid", String(child.pid), "/T", "/F"],
      { capture: true, allowedExitCodes: [0, 128] }).catch(() => {})
    if (journeyId && parentId) {
      await sql(`delete from rmc_auth_private.activation_resends where journey_id='${journeyId}';
        delete from rmc_auth_private.activation_requests where journey_id='${journeyId}';
        delete from rmc_auth_private.challenges where journey_id='${journeyId}';
        delete from rmc_auth_private.csrf_material where journey_id in ('${journeyId}','${parentId}');
        delete from rmc_auth_private.journey_transactions where id in ('${journeyId}','${parentId}');
        delete from rmc_auth_private.audit_outbox where event_id in
          (select id from rmc_auth_private.audit_events where request_id in
            ('${requestId}','${cancelRequestId ?? randomUUID()}'));
        delete from rmc_auth_private.audit_events where request_id in
          ('${requestId}','${cancelRequestId ?? randomUUID()}');`)
    }
  }
}
