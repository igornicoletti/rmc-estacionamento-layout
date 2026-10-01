import { spawn } from "node:child_process"
import { request as httpsRequest } from "node:https"
import { createServer } from "node:net"
import { randomBytes } from "node:crypto"
import { createRequire } from "node:module"
import { pathToFileURL, fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import assert from "node:assert/strict"
import { databaseGate, container } from "../auth-db/auth-db-gate.mjs"
import { npmScript, runProcess, runSteps } from "../validation/validation-process.mjs"

const origin = "https://localhost:8787"
export function assertLocalApi(url) {
  if (url !== "http://127.0.0.1:55321") throw new Error("Worker integration refuses non-local project")
}
export function httpsProbe(path, headers = {}, method = "GET") {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Invalid local probe")
  return new Promise((resolve, reject) => {
    const req = httpsRequest(origin + path, { method, headers, rejectUnauthorized: false, timeout: 5000 }, (res) => {
      const chunks = []
      let size = 0
      res.on("data", (chunk) => { size += chunk.length; if (size > 1024 * 1024) res.destroy(new Error("Probe response limit")); else chunks.push(chunk) })
      res.on("error", reject)
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }))
    })
    req.on("timeout", () => req.destroy(new Error("Probe deadline")))
    req.on("error", reject)
    req.end()
  })
}
async function assertPortFree() {
  const server = createServer()
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(8787, "127.0.0.1", resolve) })
  await new Promise((resolve) => server.close(resolve))
}
export async function workerIntegration(execute = runProcess, results = [], signal) {
  const startedAt = new Date().toISOString()
  await assertPortFree()
  const [command, prefix] = [process.execPath, [fileURLToPath(new URL("../../node_modules/supabase/dist/supabase.js", import.meta.url))]]
  const status = await execute(command, [...prefix, "status", "--output", "json"], { capture: true })
  const config = JSON.parse(status.stdout)
  assertLocalApi(config.API_URL)
  if (!config.SERVICE_ROLE_KEY) throw new Error("Local service role missing")
  const key = () => randomBytes(32).toString("base64url")
  const keyring = JSON.stringify({ currentVersion: 1, versions: { 1: { cookie: key(), csrf: key(), rate: key() } } })
  const require = createRequire(import.meta.url)
  const workerCli = join(dirname(require.resolve("wrangler/package.json")), "bin", "wrangler.js")
  const child = spawn(process.execPath, [workerCli, "dev", "--config", "worker/wrangler.jsonc", "--local",
    "--ip", "127.0.0.1", "--port", "8787", "--local-protocol", "https",
    "--var", "ENVIRONMENT:LOCAL_PRODUCTION_LIKE", "--var", "AUTH_STAGE:disabled", "--var", "BFF_CONTEXT_ENABLED:true",
    "--var", `CANONICAL_ORIGIN:${origin}`, "--var", `SUPABASE_URL:${config.API_URL}`], {
    windowsHide: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, AUTH_KEYRING: keyring, SUPABASE_SECRET_KEY: config.SERVICE_ROLE_KEY,
      CLOUDFLARE_SEND_METRICS: "false" },
  })
  let outputBytes = 0
  let exited = false
  child.on("error", () => { exited = true })
  child.on("exit", () => { exited = true })
  const capture = (chunk) => { outputBytes += chunk.length }
  child.stdout.on("data", capture); child.stderr.on("data", capture)
  const terminate = () => {
    if (!child.pid || exited) return
    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" })
      killer.on("error", () => child.kill())
    } else { try { process.kill(-child.pid, "SIGKILL") } catch { child.kill() } }
  }
  signal?.addEventListener("abort", terminate, { once: true })
  if (signal?.aborted) terminate()
  const ids = []
  try {
    const start = Date.now()
    while (true) {
      signal?.throwIfAborted()
      if (exited || outputBytes > 1024 * 1024 || Date.now() - start > 60_000) throw new Error("Worker local startup failed; captured output suppressed")
      try { if ((await httpsProbe("/api/health")).status === 200) break } catch { /* bounded readiness */ }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    for (const path of ["/api", "/api/missing", "/api/auth/login", "/api/auth/refresh"]) {
      const response = await httpsProbe(path, { Accept: "text/html", "Sec-Fetch-Mode": "navigate" })
      assert.equal(response.status, 404)
      assert.equal(response.headers["content-type"], "application/problem+json")
      assert.equal(response.headers["cache-control"], "no-store")
      assert.equal(JSON.parse(response.body).code, "RESOURCE_NOT_FOUND")
    }
    for (const path of ["/", "/clientes/1001"]) {
      const response = await httpsProbe(path, { Accept: "text/html", "Sec-Fetch-Mode": "navigate" })
      assert.equal(response.status, 200)
      assert.ok(response.headers["content-security-policy"].includes("script-src 'self'"))
      assert.ok(!response.headers["content-security-policy"].includes("unsafe-eval"))
      assert.equal(response.headers["cache-control"], "no-cache")
      const asset = response.body.match(/src="(\/assets\/[^"]+\.js)"/)?.[1]
      assert.ok(asset, "HTML references fingerprinted script")
      const fingerprinted = await httpsProbe(asset)
      assert.equal(fingerprinted.status, 200)
      assert.equal(fingerprinted.headers["cache-control"], "public, max-age=31536000, immutable")
    }
    const first = await httpsProbe("/api/auth/context", { "Sec-Fetch-Site": "same-origin" })
    assert.equal(first.status, 200, "Real local PREAUTH bootstrap must succeed")
    const context = JSON.parse(first.body)
    assert.match(context.contextId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    ids.push(context.contextId)
    assert.equal(context.authority.purpose, "PREAUTH")
    assert.match(context.csrfToken, /^[A-Za-z0-9_-]{43}$/)
    const setCookie = first.headers["set-cookie"][0]
    assert.match(setCookie, /^__Host-rmc-preauth=/)
    for (const attribute of ["Secure", "HttpOnly", "SameSite=Strict", "Path=/"]) assert.ok(setCookie.includes(attribute))
    assert.ok(!setCookie.includes("Domain="))
    const cookie = setCookie.split(";")[0]
    const tabs = await Promise.all(Array.from({ length: 10 }, () => httpsProbe("/api/auth/context", { Cookie: cookie, "Sec-Fetch-Site": "same-origin" })))
    for (const response of tabs) {
      assert.equal(response.status, 200)
      assert.equal(JSON.parse(response.body).csrfToken, context.csrfToken)
      assert.equal(JSON.parse(response.body).authority.expiresAt, context.authority.expiresAt)
      assert.equal(response.headers["set-cookie"], undefined)
    }
    assert.equal((await httpsProbe("/api/auth/context", { Cookie: `${cookie}; ${cookie}` })).status, 403)
    assert.equal((await httpsProbe("/api/auth/context", { Cookie: cookie, Origin: "https://other.invalid" })).status, 403)
    for (const site of ["same-site", "cross-site"]) assert.equal((await httpsProbe("/api/auth/context", { Cookie: cookie, "Sec-Fetch-Site": site })).status, 403)
    // Chromium proves cookie storage and JavaScript HttpOnly isolation over HTTPS.
    const { chromium } = await import("@playwright/test")
    const browser = await chromium.launch()
    const cancelBrowser = () => { void browser.close().catch(() => {}) }
    signal?.addEventListener("abort", cancelBrowser, { once: true })
    if (signal?.aborted) cancelBrowser()
    try {
      const browserContext = await browser.newContext({ ignoreHTTPSErrors: true })
      const page = await browserContext.newPage()
      await page.goto(origin)
      const browserResult = await page.evaluate(async () => {
        const response = await fetch("/api/auth/context", { credentials: "same-origin", cache: "no-store" })
        return { status: response.status, context: await response.json(), visibleCookies: document.cookie }
      })
      assert.equal(browserResult.status, 200)
      assert.match(browserResult.context.contextId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      ids.push(browserResult.context.contextId)
      assert.ok(!browserResult.visibleCookies.includes("__Host-rmc-preauth"))
      const cookies = await browserContext.cookies()
      assert.ok(cookies.some((c) => c.name === "__Host-rmc-preauth" && c.secure && c.httpOnly && c.sameSite === "Strict"))
    } finally { signal?.removeEventListener("abort", cancelBrowser); await browser.close() }
    results.push({ label: "F03 HTTPS/PostgreSQL/browser", startedAt, finishedAt: new Date().toISOString(), exitCode: 0 })
    console.log("F03 HTTPS integration: API/SPA headers, real PREAUTH, 10 tabs and Chromium cookies passed")
  } finally {
    signal?.removeEventListener("abort", terminate)
    if (child.pid && !exited) {
      if (process.platform === "win32") await runProcess("taskkill", ["/pid", String(child.pid), "/T", "/F"], { capture: true, allowedExitCodes: [0,128] })
      else { try { process.kill(-child.pid, "SIGKILL") } catch { child.kill() } }
    }
    if (ids.length) await runProcess("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-AtX", "-v", "ON_ERROR_STOP=1", "-c",
      `begin; delete from rmc_auth_private.csrf_material where journey_id in (${ids.map((id) => `'${id}'`).join(",")}); delete from rmc_auth_private.journey_transactions where id in (${ids.map((id) => `'${id}'`).join(",")}) and purpose='PREAUTH'; delete from rmc_auth_private.rate_limit_buckets where purpose in ('PREAUTH_IP','PREAUTH_GLOBAL'); commit;`], { capture: true })
    if (ids.length) {
      const clean = await runProcess("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-AtX", "-c", "select (select count(*) from rmc_auth_private.csrf_material)+(select count(*) from rmc_auth_private.journey_transactions)"], { capture: true })
      assert.equal(clean.stdout.trim(), "0", "HTTPS fixture cleanup confirmed")
    }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const abort = new AbortController()
  const cancel = () => abort.abort()
  process.once("SIGINT", cancel); process.once("SIGTERM", cancel)
  const execute = (command, args, options) => runProcess(command, args, { ...options, signal: args.includes("db:stop") ? undefined : abort.signal })
  try {
    const [command, args] = npmScript("build:assets")
    await runSteps([{ label: "build:assets", command, args }], execute)
    await databaseGate(execute, [], (run, results) => workerIntegration(run, results, abort.signal))
  } finally { process.removeListener("SIGINT", cancel); process.removeListener("SIGTERM", cancel) }
}
