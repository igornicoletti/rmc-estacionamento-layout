import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

const container = "supabase_db_rmc-estacionamento-layout";

function query(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-AtX", "-v", "ON_ERROR_STOP=1", "-c", sql],
      { windowsHide: true },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `psql exited with ${code}`));
    });
  });
}

async function concurrent(count, operation) {
  return Promise.allSettled(Array.from({ length: count }, (_, index) => operation(index)));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await query(`
  truncate rmc_auth_private.identities cascade;
  insert into rmc_auth_private.identities (id, role) values
    ('10000000-0000-4000-8000-000000000001', 'O'),
    ('10000000-0000-4000-8000-000000000002', 'M');
  insert into rmc_auth_private.units_state (id, source_system, external_unit_key, observed_at)
    values ('20000000-0000-4000-8000-000000000001', 'SYNTHETIC_TEST', 'F02-CONCURRENCY', clock_timestamp());
  insert into rmc_auth_private.functional_sessions
    (id, identity_id, purpose, assurance, cookie_hash, key_version, generation, expires_at, idle_expires_at)
    values ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
      'NORMAL', 'aal2', decode(repeat('31', 32), 'hex'), 1, 1, now() + interval '1 hour', now() + interval '30 minute');
  insert into rmc_auth_private.journey_transactions
    (id, identity_id, purpose, binding_hash, state, expires_at)
    values ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
      'PREAUTH', decode(repeat('41', 32), 'hex'), 'PENDING', now() + interval '10 minute');
  insert into rmc_auth_private.challenges
    (id, journey_id, identity_id, purpose, verifier_hash, ciphertext, key_version, binding_hash, generation, max_attempts, expires_at)
    values ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001', 'PREAUTH', decode(repeat('51', 32), 'hex'),
      decode(repeat('52', 48), 'hex'), 1, decode(repeat('53', 32), 'hex'), 1, 5, now() + interval '5 minute');
`);

const challengeResults = await concurrent(50, () =>
  query("select rmc_auth_api.consume_challenge('50000000-0000-4000-8000-000000000001', 1)"),
);
assert(challengeResults.filter((result) => result.status === "fulfilled" && result.value === "t").length === 1,
  "challenge CAS must have exactly one winner among 50 connections");

const idempotencyKey = "60000000-0000-4000-8000-000000000001";
const commandResults = await concurrent(50, () => {
  const commandId = randomUUID();
  return query(`select rmc_auth_api.claim_command('${commandId}', '${idempotencyKey}', decode(repeat('61', 32), 'hex'), 'F02_TEST')->>'commandId'`);
});
assert(commandResults.every((result) => result.status === "fulfilled"), "same-intent command claims must all succeed");
const commandIds = new Set(commandResults.map((result) => result.value));
assert(commandIds.size === 1, "same idempotency key and intent must return one durable command");
assert(await query(`select count(*) from rmc_auth_private.command_ledger where idempotency_key='${idempotencyKey}'`) === "1",
  "same-intent command race must persist one row");

await query(`insert into rmc_auth_private.identities (id, role)
  select ('70000000-0000-4000-8000-' || lpad(to_hex(value), 12, '0'))::uuid, 'M'
  from generate_series(1, 50) value`);
const assignmentResults = await concurrent(50, (index) => {
  const suffix = (index + 1).toString(16).padStart(12, "0");
  return query(`insert into rmc_auth_private.assignments (identity_id, unit_id, role, created_by_command_id)
    values ('70000000-0000-4000-8000-${suffix}', '20000000-0000-4000-8000-000000000001', 'M', '${randomUUID()}')`);
});
assert(assignmentResults.filter((result) => result.status === "fulfilled").length === 1,
  "manager cardinality must have exactly one winner among 50 connections");

await query("update rmc_auth_private.functional_sessions set revoked_at=clock_timestamp() where identity_id='10000000-0000-4000-8000-000000000001'");
const sessionResults = await concurrent(50, (index) => query(`
  insert into rmc_auth_private.functional_sessions
    (identity_id, purpose, assurance, cookie_hash, key_version, generation, expires_at, idle_expires_at)
  values ('10000000-0000-4000-8000-000000000001', 'NORMAL', 'aal2',
    decode(md5('${index}-a') || md5('${index}-b'), 'hex'), 1, ${index + 2}, now() + interval '1 hour', now() + interval '30 minute')
`));
assert(sessionResults.filter((result) => result.status === "fulfilled").length === 1,
  "NORMAL session cardinality must have exactly one winner among 50 connections");

for (const count of [2, 5, 10, 50]) {
  await query("delete from rmc_auth_private.refresh_leases where session_id='30000000-0000-4000-8000-000000000001'");
  const leaseResults = await concurrent(count, () => query(`
    select acquired from rmc_auth_api.acquire_refresh_lease(
      '30000000-0000-4000-8000-000000000001', '${randomUUID()}', 1, 10)
  `));
  assert(leaseResults.filter((result) => result.status === "fulfilled" && result.value === "t").length === 1,
    `refresh lease must have exactly one winner among ${count} connections`);
}

console.log("F02 concurrency: PASS (CAS=50, command=50, manager=50, session=50, leases=2/5/10/50)");
