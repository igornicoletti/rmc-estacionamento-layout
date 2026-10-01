import assert from "node:assert/strict"
import { createCipheriv, createHmac, randomBytes, randomUUID } from "node:crypto"
import { pathToFileURL } from "node:url"
import { mkdir, writeFile } from "node:fs/promises"
import { createClient } from "@supabase/supabase-js"
import { databaseGate, container, projectId } from "../../scripts/auth-db/auth-db-gate.mjs"
import { nodeCli, runProcess } from "../../scripts/validation/validation-process.mjs"

const localApi = "http://127.0.0.1:55321"
const domain = "auth.rmc.invalid" // Synthetic selector only; never a production domain.
const expectedAuthImage = "public.ecr.aws/supabase/gotrue:v2.197.0|sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b"
export function assertLocalProvider(url) {
  if (url !== localApi) throw new Error("Provider PoC refuses non-local project")
}
export function hasOwnedUser(user, reservation) {
  const metadata = user?.app_metadata?.rmc_provisioning
  return user?.id === reservation.provider_subject
    && user.email === `u-${reservation.provider_subject}@${domain}`
    && (!user.phone || user.phone === "") && !user.phone_confirmed_at
    && metadata?.purpose === "PROVISION_IDENTITY" && metadata.contractVersion === "1.1"
    && metadata.commandId === reservation.command_id && metadata.identityId === reservation.identity_id
    && metadata.ownershipBinding === reservation.ownership_binding
    && metadata.identityGeneration === reservation.identity_generation
    && Object.keys(metadata).length === 6
}

// This runner has no browser endpoint, arbitrary URL, free SQL input or secret output.
async function query(sql) {
  const result = await runProcess("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres",
    "-AtXq", "-v", "ON_ERROR_STOP=1", "-c", sql], { capture: true, timeout: 30_000 })
  return result.stdout.trim()
}
export function providerPocClient(url, key, allowedIds, transport = fetch, parentSignal) {
  assertLocalProvider(url)
  if (!key) throw new Error("Local provider key missing")
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const target = new URL(input instanceof Request ? input.url : String(input))
      const method = init?.method ?? "GET"
      const users = "/auth/v1/admin/users"
      if (target.origin !== localApi || target.search || target.hash
        || !(method === "POST" && target.pathname === users
          || ["GET", "DELETE"].includes(method) && allowedIds.some((id) => target.pathname === `${users}/${id}`))) {
        throw new Error("Provider PoC transport target denied")
      }
      if (method === "POST" && !allowedIds.includes(JSON.parse(init.body).id)) throw new Error("Provider PoC reserved UUID denied")
      const timeout = AbortSignal.timeout(5000)
      const signal = parentSignal ? AbortSignal.any([timeout, parentSignal]) : timeout
      signal.throwIfAborted()
      const response = await transport(input, { ...init, redirect: "error", signal })
      if (response.status >= 300 && response.status < 400
        || response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
        void response.body?.cancel().catch(() => {})
        throw new Error("Provider PoC payload rejected")
      }
      const reader = response.body?.getReader()
      const cancel = () => { void reader?.cancel().catch(() => {}) }
      signal.addEventListener("abort", cancel, { once: true })
      const chunks = []
      let size = 0
      try {
        if (reader) {
          while (true) {
            signal.throwIfAborted()
            const { value, done } = await reader.read()
            signal.throwIfAborted()
            if (done) break
            size += value.byteLength
            if (size > 65536) throw new Error("Provider PoC response limit")
            chunks.push(value)
          }
        }
        const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)))
        const version = response.headers.get("X-Supabase-Api-Version")
        return Response.json(data, { status: response.status, headers: version ? { "X-Supabase-Api-Version": version } : {} })
      } finally {
        signal.removeEventListener("abort", cancel)
        if (reader) { void reader.cancel().catch(() => {}); reader.releaseLock() }
      }
    } },
  })
}

export async function providerPoc(signal) {
  signal?.throwIfAborted()
  const [cli, prefix] = nodeCli("supabase/dist/supabase.js")
  const status = await runProcess(cli, [...prefix, "status", "--output", "json"], { capture: true })
  const config = JSON.parse(status.stdout)
  assertLocalProvider(config.API_URL)
  const authContainer = `supabase_auth_${projectId}`
  const image = await runProcess("docker", ["inspect", authContainer, "--format", "{{.Config.Image}}|{{.Image}}"], { capture: true })
  const version = await runProcess("docker", ["exec", authContainer, "auth", "version"], { capture: true })
  assert.equal(image.stdout.trim(), expectedAuthImage, "Auth image changed; research/revalidation required")
  assert.equal(version.stdout.split(/\r?\n/)[0].trim(), "v2.197.0")
  console.log(`Local Auth runtime: ${image.stdout.trim()}; v2.197.0`)

  const identityId = randomUUID(), commandId = randomUUID(), owner = randomUUID()
  let reservation
  let client
  let providerMayExist = false
  let providerAbsent = true
  let stage = "CPF source and command fixture"
  try {
    const cpf = "12345678909" // Canonical synthetic fixture, never user data.
    const sourceKey = randomBytes(32), lookupKey = randomBytes(32), iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", sourceKey, iv)
    cipher.setAAD(Buffer.from(JSON.stringify([1, "A256GCM", "CPF", identityId, 1, 1])))
    const ciphertext = Buffer.concat([iv, cipher.update(cpf, "utf8"), cipher.final(), cipher.getAuthTag()]).toString("hex")
    const hash = createHmac("sha256", lookupKey).update(JSON.stringify(["CPF_LOOKUP", 1, cpf])).digest("hex")
    await query(`insert into rmc_auth_private.identities(id,role) values ('${identityId}','R');
      select rmc_auth_api.write_cpf_source('${identityId}',1,(select generation from rmc_auth_private.cpf_lookup_policy),0,1,
      decode('${ciphertext}','hex'),array[1],array[decode('${hash}','hex')]);
      select rmc_auth_api.claim_command('${commandId}','${randomUUID()}',decode('${randomBytes(32).toString("hex")}','hex'),'PROVISION_IDENTITY',null,'${identityId}')`)
    stage = "persistent provider reservation"
    reservation = JSON.parse(await query(`set role service_role; select row_to_json(r) from rmc_auth_api.reserve_provider('${commandId}',1,'${owner}') r`))
    assert.equal(reservation.command_id, commandId)
    assert.equal(reservation.identity_id, identityId)
    for (const value of [reservation.provider_subject, reservation.ownership_binding]) assert.match(value, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    assert.equal(reservation.state, "RESERVED")
    client = providerPocClient(config.API_URL, config.SERVICE_ROLE_KEY, [reservation.provider_subject], fetch, signal)
    stage = "direct absence lookup"
    const before = await client.auth.admin.getUserById(reservation.provider_subject)
    assert.equal(before.error?.status, 404)
    assert.equal(before.error?.code, "user_not_found")
    const proof = { purpose: "PROVISION_IDENTITY", contractVersion: "1.1", commandId, identityId,
      ownershipBinding: reservation.ownership_binding, identityGeneration: 1 }
    signal?.throwIfAborted()
    stage = "reserved UUID creation and ownership"
    providerMayExist = true; providerAbsent = false
    const created = await client.auth.admin.createUser({ id: reservation.provider_subject,
      email: `u-${reservation.provider_subject}@${domain}`, password: randomBytes(32).toString("base64url"),
      email_confirm: true, phone_confirm: false, app_metadata: { rmc_provisioning: proof } })
    assert.equal(created.error, null)
    assert.ok(hasOwnedUser(created.data.user, reservation), "Provider must preserve reserved UUID and private ownership")
    stage = "ownership reread"
    const read = await client.auth.admin.getUserById(reservation.provider_subject)
    assert.equal(read.error, null)
    assert.ok(hasOwnedUser(read.data.user, reservation))
    signal?.throwIfAborted()
    stage = "ownership confirmation and audited commit"
    assert.equal(await query(`set role service_role; select rmc_auth_api.record_provider_outcome('${commandId}','${owner}',1,'${reservation.provider_subject}','${reservation.ownership_binding}','OWNED')`), "t")
    signal?.throwIfAborted()
    assert.equal(await query(`set role service_role; select rmc_auth_api.commit_provider_reservation('${commandId}','${owner}',1,'${randomUUID()}','LOCAL')`), "t")
    assert.equal(await query(`select lifecycle||':'||onboarding from rmc_auth_private.identities where id='${identityId}'`), "PENDING:ACTIVATION_REQUIRED")
    assert.equal(await query(`select count(*) from rmc_auth_private.audit_events where command_id='${commandId}'`), "1")
    console.log("F04 provider PoC: reserved UUID, technical selector, private ownership, unconfirmed phone, durable association/audit, no NORMAL")
  } catch {
    console.error(`Provider PoC failed at allowlisted stage: ${stage}; payload suppressed`)
    throw new Error("Provider PoC failed")
  } finally {
    if (providerMayExist && client && reservation) {
      // Cleanup must remain bounded but cannot inherit cancellation of the test.
      client = providerPocClient(config.API_URL, config.SERVICE_ROLE_KEY, [reservation.provider_subject])
      const read = await client.auth.admin.getUserById(reservation.provider_subject)
      if (read.error?.status === 404 && read.error?.code === "user_not_found") providerAbsent = true
      else {
        assert.equal(read.error, null, "Unknown cleanup outcome; retain ownership ledger")
        assert.ok(hasOwnedUser(read.data.user, reservation), "Never remove a foreign or altered provider resource")
        // Creation issued no session. If a session appeared, stop; revocation is not simulated.
        assert.equal(await query(`select count(*) from auth.sessions where user_id='${reservation.provider_subject}'`), "0")
        const removed = await client.auth.admin.deleteUser(reservation.provider_subject)
        assert.equal(removed.error, null)
        const after = await client.auth.admin.getUserById(reservation.provider_subject)
        assert.equal(after.error?.status, 404)
        assert.equal(after.error?.code, "user_not_found")
        providerAbsent = true
      }
    }
    if (providerAbsent) {
      await query(`delete from rmc_auth_private.audit_outbox where event_id in (select id from rmc_auth_private.audit_events where command_id='${commandId}');
        delete from rmc_auth_private.audit_events where command_id='${commandId}';
        delete from rmc_auth_private.provider_reservations where command_id='${commandId}';
        delete from rmc_auth_private.command_ledger where command_id='${commandId}';
        delete from rmc_auth_private.identity_lookups where identity_id='${identityId}';
        delete from rmc_auth_private.cpf_sources where identity_id='${identityId}';
        delete from rmc_auth_private.identities where id='${identityId}'`)
      assert.equal(await query(`select (select count(*) from rmc_auth_private.identities where id='${identityId}')
        +(select count(*) from rmc_auth_private.command_ledger where command_id='${commandId}')
        +(select count(*) from rmc_auth_private.provider_reservations where command_id='${commandId}')
        +(select count(*) from rmc_auth_private.audit_events where command_id='${commandId}')`), "0")
      console.log("F04 provider PoC: exact owned synthetic provider/DB fixtures removed; confirmed absence")
    }
  }
  return { authVersion: "v2.197.0", authImage: expectedAuthImage, sdkVersion: "2.117.2", cleanupConfirmed: true }
}

export async function providerPocGate(execute = runProcess, runGate = databaseGate, runPoc = providerPoc, results = []) {
  const abort = new AbortController()
  const cancel = () => abort.abort()
  process.once("SIGINT", cancel); process.once("SIGTERM", cancel)
  try {
    let provider
    const ownedExecute = (command, args, options) => execute(command, args, {
      ...options, signal: args.includes("db:stop") ? undefined : abort.signal,
    })
    await runGate(ownedExecute, results, async () => {
      abort.signal.throwIfAborted()
      provider = await runPoc(abort.signal)
    })
    return provider
  } finally {
    process.removeListener("SIGINT", cancel); process.removeListener("SIGTERM", cancel)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const startedAt = new Date().toISOString()
  const sha = (await runProcess("git", ["rev-parse", "HEAD"], { capture: true })).stdout.trim()
  const dirty = (await runProcess("git", ["status", "--porcelain"], { capture: true })).stdout.trim() !== ""
  const results = []
  let provider
  let exitCode = 0
  try { provider = await providerPocGate(runProcess, databaseGate, providerPoc, results) }
  catch { console.error("F04 local provider PoC failed; details/keys suppressed, no foreign user deletion permitted"); exitCode = 1 }
  finally {
    await mkdir("validation-results", { recursive: true })
    await writeFile("validation-results/provider-poc.json", JSON.stringify({ scope: "F04 milestone 1, not complete phase",
      sha, dirty, startedAt, finishedAt: new Date().toISOString(), exitCode, node: process.version,
      results, provider }, null, 2))
    process.exitCode = exitCode
  }
}
