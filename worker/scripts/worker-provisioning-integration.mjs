import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { request } from "node:https"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { pathToFileURL } from "node:url"
import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { providerPoc, providerPocGate } from "./worker-provider-poc.mjs"
import { databaseGate, container } from "../../scripts/auth-db/auth-db-gate.mjs"
import { runProcess } from "../../scripts/validation/validation-process.mjs"

const origin = "https://localhost:8788"
export function validateFixtureCommand(body) {
  assert.ok(body && Object.keys(body).sort().join() === "commandId,loseResponse,operation,owner")
  for (const id of [body.commandId, body.owner]) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.ok(["START", "RECONCILE"].includes(body.operation))
  assert.equal(typeof body.loseResponse, "boolean")
}
async function probe(body, signal) {
  if (body) validateFixtureCommand(body)
  return await new Promise((resolve, reject) => {
    const req = request(origin + (body ? "/exercise" : "/health"), {
      method: body ? "POST" : "GET", headers: { "Content-Type": "application/json" },
      // Local fixture certificate only; never changes system trust or SDK TLS.
      rejectUnauthorized: false, timeout: 15000, signal,
    }, (res) => {
      const chunks = []; let size = 0
      res.on("data", (chunk) => { size += chunk.length; if (size > 16384) res.destroy(new Error("Fixture response limit")); else chunks.push(chunk) })
      res.on("error", reject)
      res.on("end", () => {
        try {
          assert.equal(res.statusCode, 200)
          assert.equal(res.headers["cache-control"], "no-store")
          assert.equal(res.headers["content-type"], "application/json")
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")))
        } catch { reject(new Error("Fixture response invalid; details suppressed")) }
      })
    })
    req.on("timeout", () => req.destroy(new Error("Fixture deadline")))
    req.on("error", () => reject(new Error("Fixture unavailable or cancelled")))
    req.end(body ? JSON.stringify(body) : undefined)
  })
}
async function withWorker(key, signal, exercise) {
  const server = createServer()
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(8788, "127.0.0.1", resolve) })
  await new Promise((resolve) => server.close(resolve))
  const require = createRequire(import.meta.url)
  const cli = join(dirname(require.resolve("wrangler/package.json")), "bin", "wrangler.js")
  const child = spawn(process.execPath, [cli, "dev", "--config", "worker/tests/fixtures/wrangler.provisioning.jsonc",
    "--local", "--ip", "127.0.0.1", "--port", "8788", "--inspector-port", "9230", "--local-protocol", "https"], {
    windowsHide: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, SUPABASE_SECRET_KEY: key, CLOUDFLARE_SEND_METRICS: "false" },
  })
  let exited = false, bytes = 0
  child.once("error", () => { exited = true })
  child.once("exit", () => { exited = true })
  const count = (chunk) => { bytes += chunk.length }
  child.stdout.on("data", count); child.stderr.on("data", count)
  const terminate = () => {
    if (exited || !child.pid) return
    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" })
      killer.on("error", () => child.kill())
    } else { try { process.kill(-child.pid, "SIGKILL") } catch { child.kill() } }
  }
  signal?.addEventListener("abort", terminate, { once: true })
  try {
    const deadline = Date.now() + 60000
    while (true) {
      signal?.throwIfAborted()
      if (exited || bytes > 1024 * 1024 || Date.now() > deadline) throw new Error("Fixture startup failed; captured output suppressed")
      try { if ((await probe(undefined, signal)).ready === true) break } catch { /* bounded readiness */ }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    await exercise()
  } finally {
    signal?.removeEventListener("abort", terminate)
    terminate()
    const deadline = Date.now() + 5000
    while (!exited && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 50))
    assert.ok(exited, "Own Worker process cleanup not confirmed")
  }
}
async function exerciseFixture(fixture, signal, loseResponse) {
  await withWorker(fixture.config.SERVICE_ROLE_KEY, signal, async () => {
    const body = { commandId: fixture.commandId, owner: fixture.owner, operation: "START", loseResponse }
    const first = await probe(body, signal)
    assert.equal(first.dispatched, 1)
    assert.deepEqual(first.result, loseResponse ? { kind: "PENDING" } : { kind: "COMMITTED", identityId: fixture.identityId })
    if (loseResponse) {
      // Synthetic fixture only; advance fence while expiring the first lease. No sleep/clock spoof.
      await runProcess("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-AtXq",
        "-v", "ON_ERROR_STOP=1", "-c", `update rmc_auth_private.provider_reservations set fence=fence+1,
        lease_expires_at=clock_timestamp()-interval '1 second' where command_id='${fixture.commandId}'`], { capture: true })
      const reconciled = await probe({ ...body, owner: randomUUID(), operation: "RECONCILE", loseResponse: false }, signal)
      assert.equal(reconciled.dispatched, 0)
      assert.deepEqual(reconciled.result, { kind: "COMMITTED", identityId: fixture.identityId })
    }
    const replay = await probe({ ...body, owner: randomUUID(), loseResponse: false }, signal)
    assert.equal(replay.dispatched, 0)
    assert.deepEqual(replay.result, { kind: "COMMITTED", identityId: fixture.identityId })
  })
}
async function provisioningPoc(signal) {
  for (const lost of [false, true]) {
    await providerPoc(signal, (fixture, parent) => exerciseFixture(fixture, parent, lost))
    console.log(lost ? "F04 Worker real: lost response, lookup-only reconciliation and terminal replay passed" : "F04 Worker real: RPC/provider/ownership/atomic audit and terminal replay passed")
  }
  return { cleanupConfirmed: true, scenarios: ["normal", "lost-response"], environment: "LOCAL", authDisabled: true }
}
export async function provisioningIntegration(results = [], signal) {
  const startedAt = new Date().toISOString()
  try {
    const proof = await provisioningPoc(signal)
    results.push({ label: "F04 Worker/RPC/provider integration", startedAt, finishedAt: new Date().toISOString(), exitCode: 0, ...proof })
    return proof
  } catch {
    results.push({ label: "F04 Worker/RPC/provider integration", startedAt, finishedAt: new Date().toISOString(), exitCode: 1 })
    throw new Error("F04 integration failed; payload suppressed")
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const startedAt = new Date().toISOString(), results = []
  const sha = (await runProcess("git", ["rev-parse", "HEAD"], { capture: true })).stdout.trim()
  const dirty = (await runProcess("git", ["status", "--porcelain"], { capture: true })).stdout.trim() !== ""
  let exitCode = 0, proof
  try { proof = await providerPocGate(runProcess, databaseGate, (signal) => provisioningIntegration(results, signal), results) }
  catch { exitCode = 1; console.error("F04 Worker integration failed; payload/secrets suppressed") }
  finally {
    await mkdir("validation-results", { recursive: true })
    await writeFile("validation-results/provisioning-integration.json", JSON.stringify({ sha, dirty, startedAt,
      finishedAt: new Date().toISOString(), exitCode, results, proof }, null, 2))
    process.exitCode = exitCode
  }
}
