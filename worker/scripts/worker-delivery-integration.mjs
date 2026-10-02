import assert from "node:assert/strict"
import { createServer } from "node:http"
import { spawn } from "node:child_process"
import { randomBytes, randomUUID } from "node:crypto"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { runProcess } from "../../scripts/validation/validation-process.mjs"
import { container } from "../../scripts/auth-db/auth-db-gate.mjs"

const sql = async (command) => (await runProcess("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-AtXq", "-v", "ON_ERROR_STOP=1", "-c", command], { capture: true })).stdout.trim()
const hex = (text) => Buffer.from(text, "base64url").toString("hex")
const key = () => randomBytes(32).toString("base64url")
export async function deliveryIntegration(results = [], signal) {
  const startedAt = new Date().toISOString(), ids = Array.from({ length: 6 }, randomUUID)
  const [identity, journey, challenge, outbox, idempotency, owner] = ids
  const token = key(), outcomes = new Map()
  let physical = 0, child, exited = false, gatewayStarted = false, seeded = false, control
  let quarantineBefore = [], quarantineCreated = [], poisonQueued = false
  const gateway = createServer(async (req, res) => {
    try {
      assert.equal(req.headers.authorization, `Bearer ${token}`)
      const chunks = []; let size = 0
      for await (const chunk of req) { size += chunk.length; assert.ok(size <= 1024); chunks.push(chunk) }
      const input = JSON.parse(Buffer.concat(chunks).toString())
      assert.equal(input.idempotencyKey, idempotency)
      if (req.url === "/send") {
        assert.equal(input.phoneE164, "+5511999999999"); assert.equal(input.body, "Código RMC: 12345678")
        if (!outcomes.has(input.idempotencyKey)) { physical++; outcomes.set(input.idempotencyKey, "ACCEPTED") }
        // Effect accepted, response unknown. Reconciliation must query stable key and never send again.
        res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ outcome: "UNKNOWN" }))
      } else {
        assert.equal(req.url, "/outcome")
        res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ outcome: outcomes.get(input.idempotencyKey) ?? "UNKNOWN" }))
      }
    } catch { res.writeHead(400); res.end() }
  })
  const probe = async (path, body) => {
    const response = await fetch(`http://127.0.0.1:5792${path}`, { method: body ? "POST" : "GET", signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(15000)]),
      headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    assert.equal(response.status, 200); return response.json()
  }
  const until = async (read, predicate) => {
    const limit = Date.now()+30000
    while (Date.now()<limit) { signal?.throwIfAborted(); const value = await read(); if (predicate(value)) return value; await new Promise((r) => setTimeout(r, 200)) }
    throw new Error("F05 integration deadline")
  }
  try {
    const config = JSON.parse((await runProcess(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "--output", "json"], { capture: true })).stdout)
    assert.equal(config.API_URL, "http://127.0.0.1:55321")
    await new Promise((resolve, reject) => { gateway.once("error", reject); gateway.listen(5791, "127.0.0.1", resolve) }); gatewayStarted = true
    // Refuse another process occupying the Worker port.
    const check = createServer(); await new Promise((resolve, reject) => { check.once("error", reject); check.listen(5792, "127.0.0.1", resolve) }); await new Promise((r) => check.close(r))
    const require = createRequire(import.meta.url), cli = join(dirname(require.resolve("wrangler/package.json")), "bin/wrangler.js")
    child = spawn(process.execPath, [cli, "dev", "--config", "worker/tests/fixtures/wrangler.delivery.jsonc", "--local", "--ip", "127.0.0.1", "--port", "5792", "--inspector-port", "9231"],
      { windowsHide: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env,
        CLOUDFLARE_SEND_METRICS: "false", SUPABASE_SECRET_KEY: config.SERVICE_ROLE_KEY, SMS_GATEWAY_TOKEN: token,
        DELIVERY_KEYRING: JSON.stringify({ currentVersion: 1, delivery: { "1": key() }, phone: { "1": key() }, receipt: { currentVersion: 1, keys: { "1": key() } } }) } })
    let bytes=0; const count = (chunk) => { bytes += chunk.length }
    child.stdout.on("data", count); child.stderr.on("data", count)
    child.on("exit", () => { exited = true }); child.on("error", () => { exited = true })
    await until(async () => { if (exited || bytes>1048576) throw new Error("Fixture startup failed")
      try { return await probe("/health") } catch { return null } }, (v) => v?.ready === true)
    const prepared = await probe("/prepare", { identityId: identity, challengeId: challenge, outboxId: outbox, idempotencyKey: idempotency })
    control = await sql("select json_build_object('enabled',enabled,'versions',key_versions) from rmc_auth_private.delivery_control")
    seeded = true
    await sql(`insert into rmc_auth_private.identities(id,role) values('${identity}','R');
      insert into rmc_auth_private.provisioning_phone_sources(identity_id,identity_generation,key_version,ciphertext) values('${identity}',1,1,decode('${hex(prepared.phone.ciphertext)}','hex'));
      insert into rmc_auth_private.journey_transactions(id,identity_id,purpose,binding_hash,state,expires_at,secret_hash,key_version) values('${journey}','${identity}','PREAUTH',decode(repeat('ab',32),'hex'),'PENDING',clock_timestamp()+interval '10 minutes',decode(repeat('cd',32),'hex'),1);
      select rmc_auth_api.create_delivery_challenge('${challenge}','${journey}',1,decode(repeat('aa',32),'hex'),decode(repeat('bb',40),'hex'),1,clock_timestamp()+interval '5 minutes',5,'${outbox}',decode('${hex(prepared.envelope.ciphertext)}','hex'),1,'${idempotency}');
      update rmc_auth_private.delivery_control set enabled=true,key_versions=array[1];`)
    // Real DB preparation crash before outbound: an expired PREPARED must remain safely sendable.
    const preparation = JSON.parse(await sql(`set role service_role; select rmc_auth_api.admit_delivery('${outbox}','${owner}',rmc_auth_private.delivery_message('${outbox}'))`))
    assert.equal(preparation.kind, "READY")
    assert.equal(await sql(`select state from rmc_auth_private.delivery_processing where outbox_id='${outbox}'`), "PREPARED")
    await sql(`update rmc_auth_private.delivery_processing set lease_until=clock_timestamp()-interval '1 second' where outbox_id='${outbox}'`)
    const claimOwners = Array.from({ length: 10 }, randomUUID)
    const claims = await Promise.allSettled(claimOwners.map((claimOwner) => sql(`set role service_role; select rmc_auth_api.claim_delivery('${claimOwner}')`)))
    for (const result of claims) assert.equal(result.status, "fulfilled")
    const winners = claims.flatMap((result, index) => result.status === "fulfilled" && JSON.parse(result.value).length === 1 ? [index] : [])
    assert.equal(winners.length, 1)
    assert.equal(await sql(`select rmc_auth_api.finish_delivery_publish('${outbox}','${claimOwners[winners[0]]}',1,false)`), "t")
    await sql(`update rmc_auth_private.delivery_outbox set next_attempt_at=clock_timestamp() where id='${outbox}'`)
    assert.deepEqual(await probe("/dispatch"), { attempted: 1 })
    const message = JSON.parse(await sql(`select rmc_auth_private.delivery_message('${outbox}')`))
    await until(() => sql(`select state from rmc_auth_private.delivery_processing where outbox_id='${outbox}'`), (s) => s === "ACCEPTED")
    assert.equal(physical, 1)
    await probe("/redeliver", message)
    await new Promise((r) => setTimeout(r, 1000)); assert.equal(physical, 1)
    assert.equal(await sql(`select count(*) from rmc_auth_private.delivery_attempts where outbox_id='${outbox}'`), "2")
    // The database can recover a lost Queue copy even after the send kill switch is engaged.
    await sql(`update rmc_auth_private.delivery_processing set state='RECONCILIATION_REQUIRED',lease_until=clock_timestamp(),next_reconcile_at=clock_timestamp() where outbox_id='${outbox}';
      update rmc_auth_private.delivery_control set enabled=false`)
    assert.deepEqual(await probe("/reconcile"), { attempted: 1, resolved: 1 })
    assert.equal(physical, 1)
    await sql("update rmc_auth_private.delivery_control set enabled=true")
    // Terminal state survives DB redelivery and receipt ordering.
    assert.equal(await sql(`select rmc_auth_api.admit_delivery('${outbox}','${owner}',rmc_auth_private.delivery_message('${outbox}'))->>'kind'`), "DONE")
    const receipt = randomUUID()
    await sql(`update rmc_auth_private.delivery_processing set state='DEAD' where outbox_id='${outbox}'`)
    assert.equal(await sql(`select rmc_auth_api.apply_delivery_receipt('${receipt}','${outbox}','${idempotency}','DELIVERED',clock_timestamp())`), "t")
    assert.equal(await sql(`select rmc_auth_api.apply_delivery_receipt('${randomUUID()}','${outbox}','${idempotency}','REJECTED',clock_timestamp())`), "t")
    assert.equal(await sql(`select state from rmc_auth_private.delivery_processing where outbox_id='${outbox}'`), "DELIVERED")
    // Exercise the actual local Queue -> DLQ consumer path for a malformed message.
    quarantineBefore = (await sql("select encode(message_hash,'hex') from rmc_auth_private.delivery_quarantine order by message_hash")).split("\n").filter(Boolean)
    await probe("/poison"); poisonQueued = true
    await until(async () => {
      const hashes = (await sql("select encode(message_hash,'hex') from rmc_auth_private.delivery_quarantine order by message_hash")).split("\n").filter(Boolean)
      quarantineCreated = hashes.filter((hash) => !quarantineBefore.includes(hash))
      return quarantineCreated.length
    }, (count) => count === 1)
    assert.equal(await sql(`select reason from rmc_auth_private.delivery_quarantine where message_hash=decode('${quarantineCreated[0]}','hex')`), "MALFORMED")
    assert.equal(physical, 1)
    console.log("F05 Queue/Worker/PostgreSQL/local SMS: preparation crash, lost response, kill-switch reconciliation, duplicate and late monotonic receipts passed")
    results.push({ label: "F05 Queue/Worker/DB/SMS integration", startedAt, finishedAt: new Date().toISOString(), exitCode: 0, physicalSyntheticSends: physical, quarantinedPoison: quarantineCreated.length })
  } catch {
    results.push({ label: "F05 Queue/Worker/DB/SMS integration", startedAt, finishedAt: new Date().toISOString(), exitCode: 1 })
    throw new Error("F05 integration failed; payload/secrets suppressed")
  } finally {
    if (child?.pid && !exited) {
      if (process.platform === "win32") await runProcess("taskkill", ["/pid", String(child.pid), "/T", "/F"], { capture: true }).catch(() => child.kill())
      else { try { process.kill(-child.pid, "SIGKILL") } catch { child.kill() } }
      await until(async () => exited, Boolean)
    }
    if (gatewayStarted) { gateway.closeAllConnections(); await new Promise((r) => gateway.close(r)) }
    if (seeded) {
      if (poisonQueued) {
        const current = (await sql("select encode(message_hash,'hex') from rmc_auth_private.delivery_quarantine order by message_hash")).split("\n").filter(Boolean)
        quarantineCreated = current.filter((hash) => !quarantineBefore.includes(hash))
      }
      if (quarantineCreated.length) await sql(`delete from rmc_auth_private.delivery_quarantine where message_hash in (${quarantineCreated.map((hash) => `decode('${hash}','hex')`).join(",")})`)
      const original = JSON.parse(control), versions = original.versions.map(Number)
      await sql(`delete from rmc_auth_private.delivery_receipts where outbox_id='${outbox}';
      delete from rmc_auth_private.audit_outbox where event_id in(select id from rmc_auth_private.audit_events where request_id='${outbox}');
      delete from rmc_auth_private.audit_events where request_id='${outbox}';
      delete from rmc_auth_private.delivery_attempts where outbox_id='${outbox}'; delete from rmc_auth_private.delivery_processing where outbox_id='${outbox}';
      delete from rmc_auth_private.delivery_outbox where id='${outbox}'; delete from rmc_auth_private.challenges where id='${challenge}';
      delete from rmc_auth_private.journey_transactions where id='${journey}'; delete from rmc_auth_private.provisioning_phone_sources where identity_id='${identity}';
      delete from rmc_auth_private.identities where id='${identity}';
      update rmc_auth_private.delivery_control set enabled=${original.enabled ? "true" : "false"},key_versions=ARRAY[${versions.join(",")}]::integer[];`)
    }
  }
}
