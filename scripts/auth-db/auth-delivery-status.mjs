import { container } from "./auth-db-gate.mjs"
import { runProcess } from "../validation/validation-process.mjs"

if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== "--assert-drained")) {
  throw new Error("Usage: auth-delivery-status.mjs [--assert-drained]")
}

// Local-only, redacted operational snapshot. No key, OTP, phone, message body or identifier leaves PostgreSQL.
const query = `select json_build_object(
  'unprocessed', (select count(*) from rmc_auth_private.delivery_outbox o
    where o.state in ('PENDING','FAILED','CLAIMED','PUBLISHED','DEAD_LETTER')
    and not exists (select 1 from rmc_auth_private.delivery_processing p where p.outbox_id=o.id)),
  'deadLetter', (select count(*) from rmc_auth_private.delivery_outbox where state='DEAD_LETTER'),
  'ambiguous', (select count(*) from rmc_auth_private.delivery_processing
    where state in ('REQUESTED','UNKNOWN','RECONCILIATION_REQUIRED')),
  'prepared', (select count(*) from rmc_auth_private.delivery_processing where state='PREPARED'),
  'quarantine', (select count(*) from rmc_auth_private.delivery_quarantine),
  'oldestUnprocessedSeconds', (select coalesce(greatest(0,extract(epoch from clock_timestamp()-min(o.created_at)))::bigint,0)
    from rmc_auth_private.delivery_outbox o where o.state in ('PENDING','FAILED','CLAIMED','PUBLISHED','DEAD_LETTER')
    and not exists (select 1 from rmc_auth_private.delivery_processing p where p.outbox_id=o.id)),
  'oldestAmbiguousSeconds', (select coalesce(greatest(0,extract(epoch from clock_timestamp()-min(p.requested_at)))::bigint,0)
    from rmc_auth_private.delivery_processing p where p.state in ('REQUESTED','UNKNOWN','RECONCILIATION_REQUIRED')),
  'oldestQuarantineSeconds', (select coalesce(greatest(0,extract(epoch from clock_timestamp()-min(received_at)))::bigint,0)
    from rmc_auth_private.delivery_quarantine))`

const response = await runProcess("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-AtXq",
  "-v", "ON_ERROR_STOP=1", "-c", query], { capture: true })
const status = JSON.parse(response.stdout.trim())
const names = ["unprocessed", "deadLetter", "ambiguous", "prepared", "quarantine",
  "oldestUnprocessedSeconds", "oldestAmbiguousSeconds", "oldestQuarantineSeconds"]
if (names.some((name) => !Number.isSafeInteger(status[name]) || status[name] < 0)) throw new Error("Invalid delivery status")
console.log(JSON.stringify({ operation: "auth-delivery-status", ...status }))
if (process.argv[2] === "--assert-drained" && names.slice(0, 5).some((name) => status[name] !== 0)) process.exitCode = 1
