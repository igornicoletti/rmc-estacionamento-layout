create table rmc_auth_private.identities (
  id uuid primary key default gen_random_uuid(),
  provider_subject uuid unique,
  lifecycle rmc_auth_private.identity_lifecycle not null default 'PENDING',
  onboarding rmc_auth_private.onboarding_state not null default 'ACTIVATION_REQUIRED',
  role text not null check (role in ('S', 'A', 'R', 'M', 'O')),
  generation bigint not null default 1 check (generation > 0),
  context_version bigint not null default 1 check (context_version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  check ((lifecycle = 'DELETED') = (deleted_at is not null))
);

create table rmc_auth_private.identity_lookups (
  id bigint generated always as identity primary key,
  identity_id uuid not null references rmc_auth_private.identities(id),
  lookup_type text not null check (lookup_type in ('CPF', 'PHONE')),
  key_version integer not null check (key_version > 0),
  lookup_hash bytea not null,
  is_current boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  retired_at timestamptz,
  unique (lookup_type, key_version, lookup_hash),
  unique (identity_id, lookup_type, key_version),
  check (is_current = (retired_at is null))
);

create table rmc_auth_private.units_state (
  id uuid primary key default gen_random_uuid(),
  source_system text not null check (source_system <> '' and source_system = btrim(source_system)),
  external_unit_key text not null check (external_unit_key <> '' and external_unit_key = btrim(external_unit_key)),
  is_eligible boolean not null default false,
  generation bigint not null default 1 check (generation > 0),
  observed_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (source_system, external_unit_key)
);

create table rmc_auth_private.assignments (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references rmc_auth_private.identities(id),
  unit_id uuid not null references rmc_auth_private.units_state(id),
  role rmc_auth_private.assignment_role not null,
  valid_from timestamptz not null default clock_timestamp(),
  valid_until timestamptz,
  created_by_command_id uuid not null,
  ended_by_command_id uuid,
  check (valid_until is null or valid_until > valid_from),
  check ((valid_until is null) = (ended_by_command_id is null))
);

create table rmc_auth_private.functional_sessions (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references rmc_auth_private.identities(id),
  purpose rmc_auth_private.authority_purpose not null,
  assurance rmc_auth_private.assurance_level not null,
  cookie_hash bytea not null unique,
  provider_refresh_ciphertext bytea,
  key_version integer not null check (key_version > 0),
  generation bigint not null check (generation > 0),
  expires_at timestamptz not null,
  idle_expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check (idle_expires_at <= expires_at)
);

create table rmc_auth_private.journey_transactions (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid references rmc_auth_private.identities(id),
  purpose rmc_auth_private.authority_purpose not null,
  binding_hash bytea not null,
  generation bigint not null default 1 check (generation > 0),
  state text not null check (state in ('PENDING', 'VERIFIED', 'COMMITTED', 'EXPIRED', 'CANCELLED')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check ((state = 'COMMITTED') = (consumed_at is not null))
);

create table rmc_auth_private.challenges (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references rmc_auth_private.journey_transactions(id),
  identity_id uuid references rmc_auth_private.identities(id),
  purpose rmc_auth_private.authority_purpose not null,
  verifier_hash bytea not null,
  ciphertext bytea not null,
  key_version integer not null check (key_version > 0),
  binding_hash bytea not null,
  generation bigint not null check (generation > 0),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null check (max_attempts > 0),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  check (attempt_count <= max_attempts)
);

create table rmc_auth_private.command_ledger (
  command_id uuid primary key,
  idempotency_key uuid not null unique,
  intent_hash bytea not null,
  actor_identity_id uuid references rmc_auth_private.identities(id),
  target_identity_id uuid references rmc_auth_private.identities(id),
  command_type text not null check (command_type <> ''),
  state rmc_auth_private.command_state not null default 'CLAIMED',
  generation bigint not null default 1 check (generation > 0),
  result_code text,
  result_payload jsonb,
  reconcile_after timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check (result_payload is null or jsonb_typeof(result_payload) = 'object')
);

create table rmc_auth_private.delivery_outbox (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references rmc_auth_private.challenges(id),
  identity_id uuid references rmc_auth_private.identities(id),
  purpose rmc_auth_private.authority_purpose not null,
  envelope_ciphertext bytea not null,
  key_version integer not null check (key_version > 0),
  binding_hash bytea not null,
  idempotency_key uuid not null,
  generation bigint not null check (generation > 0),
  state rmc_auth_private.delivery_state not null default 'PENDING',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null check (max_attempts > 0),
  next_attempt_at timestamptz not null default clock_timestamp(),
  lease_owner uuid,
  lease_expires_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (idempotency_key, generation),
  check ((lease_owner is null) = (lease_expires_at is null)),
  check (attempt_count <= max_attempts)
);

create table rmc_auth_private.delivery_attempts (
  id bigint generated always as identity primary key,
  outbox_id uuid not null references rmc_auth_private.delivery_outbox(id),
  attempt_number integer not null check (attempt_number > 0),
  provider_outcome text not null check (provider_outcome in ('ACCEPTED', 'REJECTED', 'UNKNOWN', 'STALE')),
  provider_message_id text,
  attempted_at timestamptz not null default clock_timestamp(),
  unique (outbox_id, attempt_number)
);

create table rmc_auth_private.audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('AUTH_LOGIN_OUTCOME','MFA_OUTCOME','SESSION_REVOKED','SESSION_REFRESH_OUTCOME','CHALLENGE_REQUESTED','CHALLENGE_VERIFIED','RECOVERY_OUTCOME','ADMIN_COMMAND_OUTCOME','DELIVERY_OUTCOME','RECONCILIATION_REQUIRED','RECONCILIATION_RESOLVED')),
  request_id text not null check (request_id <> ''),
  command_id uuid,
  identity_id uuid references rmc_auth_private.identities(id),
  purpose rmc_auth_private.authority_purpose,
  generation bigint check (generation > 0),
  capability text,
  outcome text not null check (outcome in ('ALLOW', 'DENY', 'SUCCESS', 'FAILURE', 'UNKNOWN')),
  reason_code text not null check (reason_code <> ''),
  occurred_at timestamptz not null default clock_timestamp(),
  contract_version text not null default '1.0',
  deployment_id text not null
);

create table rmc_auth_private.audit_outbox (
  event_id uuid primary key references rmc_auth_private.audit_events(id),
  state rmc_auth_private.delivery_state not null default 'PENDING',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default clock_timestamp(),
  lease_owner uuid,
  lease_expires_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  check ((lease_owner is null) = (lease_expires_at is null))
);

create table rmc_auth_private.rate_limit_buckets (
  bucket_hash bytea not null,
  purpose text not null,
  window_started_at timestamptz not null,
  window_seconds integer not null check (window_seconds > 0),
  consumed integer not null default 0 check (consumed >= 0),
  limit_value integer not null check (limit_value > 0),
  expires_at timestamptz not null,
  primary key (bucket_hash, purpose, window_started_at),
  check (consumed <= limit_value)
);

create table rmc_auth_private.refresh_leases (
  session_id uuid primary key references rmc_auth_private.functional_sessions(id),
  owner_id uuid not null,
  generation bigint not null check (generation > 0),
  fencing_token bigint not null check (fencing_token > 0),
  expires_at timestamptz not null,
  acquired_at timestamptz not null default clock_timestamp()
);

create table rmc_auth_private.reconciliation_jobs (
  id uuid primary key default gen_random_uuid(),
  command_id uuid references rmc_auth_private.command_ledger(command_id),
  dependency text not null check (dependency <> ''),
  state rmc_auth_private.reconciliation_state not null default 'PENDING',
  generation bigint not null default 1 check (generation > 0),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null check (max_attempts > 0),
  next_attempt_at timestamptz not null,
  lease_owner uuid,
  lease_expires_at timestamptz,
  last_reason_code text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check ((lease_owner is null) = (lease_expires_at is null)),
  check (attempt_count <= max_attempts)
);
