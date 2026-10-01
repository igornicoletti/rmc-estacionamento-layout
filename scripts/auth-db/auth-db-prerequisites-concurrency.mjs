import { randomUUID } from "node:crypto"
import { container } from "./auth-db-gate.mjs"
import { runProcess } from "../validation/validation-process.mjs"

// Independent local psql processes, fixed owned container; no connection URL or secrets.
async function query(sql, role = "postgres") {
  const result = await runProcess("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres",
    "-AtXq", "-v", "ON_ERROR_STOP=1", "-c", `begin; set local statement_timeout='15s'; set local role ${role}; ${sql}; commit;`],
  { capture: true, timeout: 30_000 })
  return result.stdout.trim()
}
function assert(value, message) { if (!value) throw new Error(message) }
const identities = [randomUUID(), randomUUID()]
const command = randomUUID()
const owner = randomUUID()
const hash = `decode(md5('${command}')||md5('${owner}'),'hex')`
const hash2 = `decode(md5('${owner}')||md5('${command}'),'hex')`
const cipher = "decode(repeat('71',39),'hex')"
let policyGeneration
try {
  assert(await query("select active_version::text||':'||coalesce(pending_version::text,'') from rmc_auth_private.cpf_lookup_policy") === "1:", "expected fresh local rotation policy")
  policyGeneration = Number(await query("select generation from rmc_auth_private.cpf_lookup_policy"))
  await query(`insert into rmc_auth_private.identities(id,role) values ('${identities[0]}','R'),('${identities[1]}','R')`)
  const first = await Promise.allSettled(identities.map((identity) => query(`select rmc_auth_api.write_cpf_source('${identity}',1,${policyGeneration},0,1,${cipher},array[1],array[${hash}])`, "service_role")))
  assert(first.filter((r) => r.status === "fulfilled" && r.value === "1").length === 1, "same CPF race must have exactly one winner")
  const index = first.findIndex((r) => r.status === "fulfilled")
  const identity = identities[index]
  assert(await query(`select count(*) from rmc_auth_private.cpf_sources where identity_id in ('${identities.join("','")}')`) === "1", "duplicate race leaves exactly one source")
  policyGeneration = Number(await query(`select rmc_auth_api.begin_cpf_rotation(${policyGeneration},2)`))
  await query(`select rmc_auth_api.write_cpf_source('${identity}',1,${policyGeneration},1,1,${cipher},array[1,2],array[${hash},${hash2}])`, "service_role")
  const mixed = await Promise.allSettled([
    query(`select rmc_auth_api.write_cpf_source('${identities[1-index]}',1,${policyGeneration},0,1,${cipher},array[2],array[${hash2}])`, "service_role"),
    query(`select rmc_auth_api.write_cpf_source('${identities[1-index]}',1,${policyGeneration},0,1,${cipher},array[1,2],array[${hash},${hash2}])`, "service_role"),
  ])
  assert(mixed.every((r) => r.status === "rejected"), "new-only and duplicate dual-write must both fail")
  policyGeneration = Number(await query(`select rmc_auth_api.finish_cpf_rotation(${policyGeneration},true)`))
  await query(`select rmc_auth_api.claim_command('${command}','${randomUUID()}',${hash},'PROVISION_IDENTITY',null,'${identity}')`)
  const reserves = await Promise.all(Array.from({ length: 10 }, () => query(`select provider_subject from rmc_auth_api.reserve_provider('${command}',1,'${owner}')`, "service_role")))
  assert(new Set(reserves).size === 1, "concurrent reservation must allocate one provider UUID")
  // Expiry is a fixture transition, never a sleep or caller-provided server clock.
  await query(`update rmc_auth_private.provider_reservations set fence=fence+1,lease_expires_at=clock_timestamp()-interval '1 second' where command_id='${command}'`)
  const claims = await Promise.all(Array.from({ length: 10 }, () => query(`select (rmc_auth_api.claim_provider_reconciliation('${command}','${randomUUID()}')).command_id`, "service_role")))
  assert(claims.filter((value) => value === command).length === 1, "one reconciliation lease winner required")
  const stale = await query(`select rmc_auth_api.record_provider_outcome('${command}','${owner}',1,provider_subject,ownership_binding,'OWNED') from rmc_auth_private.provider_reservations where command_id='${command}'`, "service_role")
  assert(stale === "f", "old fence cannot confirm")
  console.log("Pre-F04 concurrency: CPF one winner, dual-version duplicates denied, one reserved UUID, one reconciliation claimant, stale fence denied")
} finally {
  // Exact synthetic IDs only; preserve singleton policy's monotonic generation.
  await query(`delete from rmc_auth_private.provider_reservations where command_id='${command}';
    delete from rmc_auth_private.command_ledger where command_id='${command}';
    delete from rmc_auth_private.identity_lookups where identity_id in ('${identities.join("','")}');
    delete from rmc_auth_private.cpf_sources where identity_id in ('${identities.join("','")}');
    delete from rmc_auth_private.identities where id in ('${identities.join("','")}')`)
  if (policyGeneration) {
    const pending = await query("select pending_version from rmc_auth_private.cpf_lookup_policy")
    if (pending) await query(`select rmc_auth_api.finish_cpf_rotation((select generation from rmc_auth_private.cpf_lookup_policy),true)`)
  }
}
