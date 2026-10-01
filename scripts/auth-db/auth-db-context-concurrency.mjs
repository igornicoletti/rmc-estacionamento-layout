import { randomUUID, randomBytes } from "node:crypto"
import assert from "node:assert/strict"
import { container } from "./auth-db-gate.mjs"
import { runProcess } from "../validation/validation-process.mjs"

const contextId = randomUUID()
const cookieHash = randomBytes(32).toString("hex")
const ipHash = randomBytes(32).toString("hex")
async function query(sql) {
  const result = await runProcess("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-AtXq", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose", "-c", sql], { capture: true, timeout: 30000, allowedExitCodes: [0, 1] })
  if (result.exitCode !== 0) {
    const error = new Error(/23505/.test(result.stderr) ? "23505" : "Unexpected SQL or infrastructure failure")
    throw error
  }
  return result.stdout.trim()
}
const call = `select rmc_auth_api.create_preauth_context('${contextId}',decode('${cookieHash}','hex'),decode(repeat('22',32),'hex'),decode(repeat('33',60),'hex'),decode(repeat('44',32),'hex'),1,decode('${ipHash}','hex'))->>'contextId'`
try {
  const results = await Promise.allSettled(Array.from({ length: 10 }, () => query(`begin; set local role service_role; ${call}; commit;`)))
  assert.equal(results.filter((r) => r.status === "fulfilled" && r.value === contextId).length, 1)
  assert.ok(results.every((r) => r.status === "fulfilled" || r.reason.message === "23505"))
  assert.equal(await query(`select count(*) from rmc_auth_private.csrf_material where journey_id='${contextId}'`), "1")
  const reads = await Promise.all(Array.from({ length: 10 }, () => query(`begin; set local role service_role; select rmc_auth_api.read_preauth_context(decode('${cookieHash}','hex'))->>'csrfHash'; commit;`)))
  assert.ok(reads.every((value) => value === "22".repeat(32)))
  const invalidations = await Promise.all(Array.from({ length: 10 }, () => query(`begin; set local role service_role; select rmc_auth_api.invalidate_preauth_csrf('${contextId}',1); commit;`)))
  assert.equal(invalidations.filter((value) => value === "t").length, 1)
  console.log("F03 concurrency: atomic create=10, stable reads=10, one invalidation=10 passed")
} finally {
  await query(`begin; delete from rmc_auth_private.csrf_material where journey_id='${contextId}'; delete from rmc_auth_private.journey_transactions where id='${contextId}'; delete from rmc_auth_private.rate_limit_buckets where bucket_hash=decode('${ipHash}','hex') and purpose='PREAUTH_IP'; commit;`)
}
