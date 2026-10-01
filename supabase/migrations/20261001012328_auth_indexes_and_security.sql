create unique index identity_lookups_one_current_kind_idx
  on rmc_auth_private.identity_lookups (identity_id, lookup_type)
  where is_current;
create index identity_lookups_hash_idx
  on rmc_auth_private.identity_lookups (lookup_type, key_version, lookup_hash);
create unique index assignments_one_current_per_identity_idx
  on rmc_auth_private.assignments (identity_id)
  where valid_until is null;
create unique index assignments_one_current_manager_per_unit_idx
  on rmc_auth_private.assignments (unit_id)
  where valid_until is null and role = 'M';
create unique index sessions_one_current_normal_per_identity_idx
  on rmc_auth_private.functional_sessions (identity_id)
  where purpose = 'NORMAL' and revoked_at is null;

create index assignments_unit_id_idx on rmc_auth_private.assignments (unit_id);
create index sessions_identity_generation_idx on rmc_auth_private.functional_sessions (identity_id, generation);
create index sessions_expiry_idx on rmc_auth_private.functional_sessions (expires_at) where revoked_at is null;
create index journeys_identity_purpose_idx on rmc_auth_private.journey_transactions (identity_id, purpose, generation);
create index journeys_expiry_idx on rmc_auth_private.journey_transactions (expires_at) where consumed_at is null;
create index challenges_journey_id_idx on rmc_auth_private.challenges (journey_id);
create index challenges_identity_generation_idx on rmc_auth_private.challenges (identity_id, generation);
create index challenges_expiry_idx on rmc_auth_private.challenges (expires_at) where consumed_at is null;
create index command_actor_idx on rmc_auth_private.command_ledger (actor_identity_id);
create index command_target_idx on rmc_auth_private.command_ledger (target_identity_id);
create index command_reconciliation_idx on rmc_auth_private.command_ledger (reconcile_after)
  where state = 'RECONCILIATION_REQUIRED';
create unique index delivery_one_per_challenge_idx on rmc_auth_private.delivery_outbox (challenge_id);
create index delivery_identity_generation_idx on rmc_auth_private.delivery_outbox (identity_id, generation);
create index delivery_dispatch_idx on rmc_auth_private.delivery_outbox (state, next_attempt_at)
  where state in ('PENDING', 'FAILED');
create index delivery_lease_idx on rmc_auth_private.delivery_outbox (lease_expires_at)
  where lease_owner is not null;
create index audit_identity_time_idx on rmc_auth_private.audit_events (identity_id, occurred_at desc);
create index audit_command_idx on rmc_auth_private.audit_events (command_id) where command_id is not null;
create index audit_dispatch_idx on rmc_auth_private.audit_outbox (state, next_attempt_at)
  where state in ('PENDING', 'FAILED');
create index limiter_expiry_idx on rmc_auth_private.rate_limit_buckets (expires_at);
create index reconciliation_dispatch_idx on rmc_auth_private.reconciliation_jobs (state, next_attempt_at)
  where state in ('PENDING', 'CLAIMED');
create index reconciliation_command_idx on rmc_auth_private.reconciliation_jobs (command_id);

create function rmc_auth_private.reject_generation_regression()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if new.generation < old.generation then
    raise exception using errcode = '23514', message = 'AUTH_GENERATION_REGRESSION';
  end if;
  return new;
end
$function$;

create trigger identities_generation_monotonic
before update of generation on rmc_auth_private.identities
for each row execute function rmc_auth_private.reject_generation_regression();
create trigger units_generation_monotonic
before update of generation on rmc_auth_private.units_state
for each row execute function rmc_auth_private.reject_generation_regression();
create trigger sessions_generation_monotonic
before update of generation on rmc_auth_private.functional_sessions
for each row execute function rmc_auth_private.reject_generation_regression();
create trigger journeys_generation_monotonic
before update of generation on rmc_auth_private.journey_transactions
for each row execute function rmc_auth_private.reject_generation_regression();
create trigger challenges_generation_monotonic
before update of generation on rmc_auth_private.challenges
for each row execute function rmc_auth_private.reject_generation_regression();
create trigger commands_generation_monotonic
before update of generation on rmc_auth_private.command_ledger
for each row execute function rmc_auth_private.reject_generation_regression();
create trigger delivery_generation_monotonic
before update of generation on rmc_auth_private.delivery_outbox
for each row execute function rmc_auth_private.reject_generation_regression();
create trigger leases_generation_monotonic
before update of generation on rmc_auth_private.refresh_leases
for each row execute function rmc_auth_private.reject_generation_regression();
create trigger reconciliation_generation_monotonic
before update of generation on rmc_auth_private.reconciliation_jobs
for each row execute function rmc_auth_private.reject_generation_regression();

do $security$
declare
  table_name text;
begin
  foreach table_name in array array[
    'identities','identity_lookups','units_state','assignments','functional_sessions',
    'journey_transactions','challenges','command_ledger','delivery_outbox',
    'delivery_attempts','audit_events','audit_outbox','rate_limit_buckets',
    'refresh_leases','reconciliation_jobs'
  ] loop
    execute format('alter table rmc_auth_private.%I enable row level security', table_name);
    execute format('alter table rmc_auth_private.%I force row level security', table_name);
  end loop;
end
$security$;

grant usage on schema rmc_auth_private to service_role;
grant select, insert, update on all tables in schema rmc_auth_private to service_role;
grant usage, select on all sequences in schema rmc_auth_private to service_role;
revoke all on all tables in schema rmc_auth_private from public, anon, authenticated;
revoke all on all sequences in schema rmc_auth_private from public, anon, authenticated;
