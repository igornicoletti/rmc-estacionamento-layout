import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

const container = "supabase_db_rmc-estacionamento-layout";
const ids = {
  identity: randomUUID(), sessionIdentity: randomUUID(), unit: randomUUID(),
  session: randomUUID(), journey: randomUUID(), challenge: randomUUID(),
  key: randomUUID(), managers: Array.from({ length: 50 }, () => randomUUID()),
};

function query(sql, role = "postgres") {
  return new Promise((resolve, reject) => {
    // Constant local container, no URL/credential input and no shell.
    const child = spawn("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres",
      "-AtXq", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose", "-c",
      `begin; set local statement_timeout='15s'; set local role ${role}; ${sql}; commit;`],
    { windowsHide: true, timeout: 30_000 });
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function race(count, operation) {
  return Promise.allSettled(Array.from({ length: count }, (_, index) => operation(index)));
}

function booleanRace(results, label) {
  assert(results.every((result) => result.status === "fulfilled" && ["t", "f"].includes(result.value)),
    `${label}: every connection must finish without SQL/infrastructure error`);
  assert(results.filter((result) => result.value === "t").length === 1, `${label}: expected exactly one winner`);
}

function uniquenessRace(results, label) {
  assert(results.filter((result) => result.status === "fulfilled").length === 1, `${label}: expected one winner`);
  assert(results.every((result) => result.status === "fulfilled" || /23505/.test(result.reason.message)),
    `${label}: losing connections must fail exclusively with unique_violation (23505)`);
}

try {
  await query(`
    insert into rmc_auth_private.identities (id,role,lifecycle,onboarding) values
      ('${ids.identity}','O','ACTIVE','COMPLETE'), ('${ids.sessionIdentity}','O','ACTIVE','COMPLETE'),
      ${ids.managers.map((id) => `('${id}','M','PENDING','ACTIVATION_REQUIRED')`).join(",")};
    insert into rmc_auth_private.units_state (id,source_system,external_unit_key,observed_at)
      values ('${ids.unit}','SYNTHETIC_TEST','${ids.unit}',clock_timestamp());
    insert into rmc_auth_private.functional_sessions
      (id,identity_id,purpose,assurance,cookie_hash,key_version,generation,expires_at,idle_expires_at)
      values ('${ids.session}','${ids.identity}','NORMAL','aal2',decode(md5('${ids.session}')||md5('${ids.identity}'),'hex'),
        1,1,now()+interval '1 hour',now()+interval '30 minutes');
    insert into rmc_auth_private.journey_transactions
      (id,identity_id,purpose,binding_hash,secret_hash,key_version,state,expires_at)
      values ('${ids.journey}','${ids.identity}','PREAUTH',decode(repeat('41',32),'hex'),
        decode(md5('${ids.journey}')||md5('${ids.key}'),'hex'),1,'PENDING',now()+interval '10 minutes');
    insert into rmc_auth_private.challenges
      (id,journey_id,identity_id,purpose,verifier_hash,ciphertext,key_version,binding_hash,generation,max_attempts,expires_at)
      values ('${ids.challenge}','${ids.journey}','${ids.identity}','PREAUTH',decode(repeat('51',32),'hex'),
        decode(repeat('52',48),'hex'),1,decode(repeat('41',32),'hex'),1,5,now()+interval '5 minutes')
  `);

  booleanRace(await race(50, () => query(
    `select rmc_auth_api.consume_challenge('${ids.challenge}',1)`, "service_role")), "challenge CAS 50");

  const commands = await race(50, () => query(
    `select rmc_auth_api.claim_command('${randomUUID()}','${ids.key}',decode(repeat('61',32),'hex'),'F02_TEST')->>'commandId'`,
    "service_role"));
  assert(commands.every((result) => result.status === "fulfilled"), "all same-intent claims must succeed");
  assert(new Set(commands.map((result) => result.value)).size === 1, "claims must return one durable command");
  assert(await query(`select count(*) from rmc_auth_private.command_ledger where idempotency_key='${ids.key}'`) === "1",
    "claims must persist one row");

  uniquenessRace(await race(50, (index) => query(`insert into rmc_auth_private.assignments
    (identity_id,unit_id,role,created_by_command_id)
    values ('${ids.managers[index]}','${ids.unit}','M','${commands[0].value}')`)), "manager 50");
  uniquenessRace(await race(50, () => {
    const cookie = randomUUID();
    return query(`insert into rmc_auth_private.functional_sessions
      (identity_id,purpose,assurance,cookie_hash,key_version,generation,expires_at,idle_expires_at)
      values ('${ids.sessionIdentity}','NORMAL','aal2',decode(md5('${cookie}')||md5('${ids.key}'),'hex'),
        1,1,now()+interval '1 hour',now()+interval '30 minutes')`);
  }), "NORMAL session 50");

  for (const count of [2, 5, 10, 50]) {
    // Expire, never recreate: fencing_token must survive takeover.
    await query(`update rmc_auth_private.refresh_leases
      set expires_at=clock_timestamp()-interval '1 second', acquired_at=clock_timestamp()-interval '2 seconds',
        fencing_token=fencing_token+1 where session_id='${ids.session}'`);
    booleanRace(await race(count, () => query(
      `select acquired from rmc_auth_api.acquire_refresh_lease('${ids.session}','${randomUUID()}',1,60)`,
      "service_role")), `lease ${count}`);
  }
  console.log("F02 concurrency: PASS (CAS=50, command=50, manager=50, session=50, leases=2/5/10/50; all outcomes verified)");
} finally {
  // Only UUIDs created by this execution are removed, including after failure.
  await query(`
    delete from rmc_auth_private.refresh_leases where session_id='${ids.session}';
    delete from rmc_auth_private.functional_sessions where identity_id in ('${ids.identity}','${ids.sessionIdentity}');
    delete from rmc_auth_private.challenges where journey_id='${ids.journey}';
    delete from rmc_auth_private.journey_transactions where id='${ids.journey}';
    delete from rmc_auth_private.assignments where unit_id='${ids.unit}';
    delete from rmc_auth_private.units_state where id='${ids.unit}';
    delete from rmc_auth_private.command_ledger where idempotency_key='${ids.key}';
    delete from rmc_auth_private.identities where id in ('${ids.identity}','${ids.sessionIdentity}',
      ${ids.managers.map((id) => `'${id}'`).join(",")})
  `);
}
