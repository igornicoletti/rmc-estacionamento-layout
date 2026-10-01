-- F02 correction: grants, shape and CAS must be safe even for privileged callers.
alter table rmc_auth_private.identities
  add column active_superadmin_slot smallint,
  add constraint identities_active_superadmin_slot check (
    (role='S' and lifecycle='ACTIVE' and active_superadmin_slot is not null and active_superadmin_slot between 1 and 2)
    or ((role <> 'S' or lifecycle <> 'ACTIVE') and active_superadmin_slot is null)),
  add constraint identities_two_active_superadmins unique (active_superadmin_slot);
alter table rmc_auth_private.identity_lookups
  add constraint lookups_sha256 check (octet_length(lookup_hash) = 32);
alter table rmc_auth_private.functional_sessions
  add column identity_generation bigint not null default 1 check (identity_generation > 0),
  add column refresh_binding_hash bytea,
  add column refresh_key_version integer,
  add column refresh_purpose text,
  add constraint sessions_cookie_sha256 check (octet_length(cookie_hash) = 32),
  add constraint sessions_refresh_envelope check (
    (provider_refresh_ciphertext is null and refresh_binding_hash is null
      and refresh_key_version is null and refresh_purpose is null)
    or (provider_refresh_ciphertext is not null and octet_length(provider_refresh_ciphertext) >= 29
      and refresh_binding_hash is not null and octet_length(refresh_binding_hash) = 32
      and refresh_key_version is not null and refresh_key_version > 0
      and refresh_purpose is not null and refresh_purpose = 'PROVIDER_REFRESH')),
  add constraint sessions_valid_times check (expires_at > created_at and idle_expires_at > created_at);
alter table rmc_auth_private.journey_transactions
  add column identity_generation bigint not null default 1 check (identity_generation > 0),
  add column secret_hash bytea not null,
  add column key_version integer not null,
  add constraint journeys_secret_sha256 check (octet_length(secret_hash) = 32),
  add constraint journeys_key_version check (key_version > 0),
  add constraint journeys_binding_sha256 check (octet_length(binding_hash) = 32),
  add constraint journeys_valid_times check (expires_at > created_at),
  add constraint journeys_binding_unique unique (id, purpose, binding_hash);
alter table rmc_auth_private.challenges
  add constraint challenges_verifier_sha256 check (octet_length(verifier_hash) = 32),
  add constraint challenges_binding_sha256 check (octet_length(binding_hash) = 32),
  add constraint challenges_envelope_size check (octet_length(ciphertext) >= 29),
  add constraint challenges_valid_times check (expires_at > created_at),
  add constraint challenges_journey_binding foreign key (journey_id, purpose, binding_hash)
    references rmc_auth_private.journey_transactions (id, purpose, binding_hash),
  add constraint challenges_delivery_binding_unique unique (id, purpose, binding_hash, generation);
alter table rmc_auth_private.delivery_outbox
  add constraint delivery_binding_sha256 check (octet_length(binding_hash) = 32),
  add constraint delivery_envelope_size check (octet_length(envelope_ciphertext) >= 29),
  add constraint delivery_challenge_binding foreign key (challenge_id, purpose, binding_hash, generation)
    references rmc_auth_private.challenges (id, purpose, binding_hash, generation);
alter table rmc_auth_private.command_ledger
  add constraint commands_intent_sha256 check (octet_length(intent_hash) = 32),
  add constraint commands_type_bounded check (command_type ~ '^[A-Z][A-Z0-9_]{0,63}$'),
  -- No generic result body before operation-specific schemas are implemented.
  add constraint commands_result_sanitized check (result_payload is null or result_payload = '{}'::jsonb),
  add constraint commands_result_code_bounded check (result_code ~ '^[A-Z][A-Z0-9_]{0,63}$');
alter table rmc_auth_private.rate_limit_buckets
  add constraint limiter_hash_sha256 check (octet_length(bucket_hash) = 32),
  add constraint limiter_purpose_bounded check (purpose ~ '^[A-Z][A-Z0-9_]{0,63}$'),
  add constraint limiter_valid_times check (expires_at > window_started_at);
alter table rmc_auth_private.audit_events
  add constraint audit_reason_allowlist check (reason_code in (
    'VERIFIED','REVOKED','COMMITTED','ACCEPTED','DELIVERED','EXPIRED','STALE','RECONCILIATION_REQUIRED',
    'AUTH_INVALID_REQUEST','AUTH_SESSION_INVALID','AUTH_CREDENTIALS_INVALID','AUTH_ORIGIN_DENIED',
    'AUTH_CSRF_INVALID','AUTH_ACCESS_DENIED','AUTH_STEP_UP_REQUIRED','RESOURCE_NOT_FOUND',
    'AUTH_STATE_CONFLICT','AUTH_BODY_TOO_LARGE','AUTH_UNSUPPORTED_MEDIA_TYPE','AUTH_RATE_LIMITED',
    'AUTH_CONFIGURATION_ERROR','AUTH_UNEXPECTED_ERROR','AUTH_PROVIDER_FAILURE',
    'AUTH_DEPENDENCY_UNAVAILABLE','AUTH_DEPENDENCY_TIMEOUT')),
  add constraint audit_capability_allowlist check (capability in (
    'users.read','users.create','users.update_profile','users.change_role','users.change_unit',
    'users.resend_activation','users.start_recovery','users.suspend','users.resume','users.block',
    'users.unblock','users.disable','users.reactivate','users.end_session','users.reset_mfa',
    'users.audit.read','users.cpf.reveal')),
  add constraint audit_request_bounded check (request_id ~ '^[A-Za-z0-9_-]{8,128}$'),
  add constraint audit_deployment_bounded check (deployment_id ~ '^[A-Za-z0-9_.-]{1,128}$'),
  add constraint audit_contract_version check (contract_version='1.0');
alter table rmc_auth_private.refresh_leases
  add constraint leases_valid_times check (expires_at > acquired_at);

-- External availability and local override are independent facts (T26).
alter table rmc_auth_private.units_state drop column is_eligible;
alter table rmc_auth_private.units_state
  add column source_is_active boolean not null default false,
  add column local_is_enabled boolean not null default false,
  add column is_eligible boolean generated always as (source_is_active and local_is_enabled) stored;

create index journeys_binding_idx on rmc_auth_private.journey_transactions (binding_hash);
create unique index journeys_secret_hash_idx on rmc_auth_private.journey_transactions (secret_hash);
drop index rmc_auth_private.identity_lookups_hash_idx;
alter table rmc_auth_private.assignments
  add constraint assignments_creation_command foreign key (created_by_command_id)
    references rmc_auth_private.command_ledger (command_id),
  add constraint assignments_end_command foreign key (ended_by_command_id)
    references rmc_auth_private.command_ledger (command_id);
alter table rmc_auth_private.audit_events
  add constraint audit_command foreign key (command_id) references rmc_auth_private.command_ledger (command_id);
create index assignments_creation_command_idx on rmc_auth_private.assignments (created_by_command_id);
create index assignments_end_command_idx on rmc_auth_private.assignments (ended_by_command_id)
  where ended_by_command_id is not null;

-- ADR-001 applies to RMC IDs, not the external provider subject.
do $uuid_constraints$
declare field record;
begin
  for field in select table_name,column_name from information_schema.columns
    where table_schema='rmc_auth_private' and udt_name='uuid' and column_name <> 'provider_subject'
  loop
    execute format('alter table rmc_auth_private.%I add constraint %I check (%I::text ~ %L)',
      field.table_name, field.table_name||'_'||field.column_name||'_v4', field.column_name,
      '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
  end loop;
end
$uuid_constraints$;

create function rmc_auth_private.guard_persisted_authority()
returns trigger language plpgsql security invoker set search_path = ''
as $function$
begin
  if tg_table_name = 'functional_sessions' then
    if new.id is distinct from old.id or new.identity_id is distinct from old.identity_id
      or new.purpose is distinct from old.purpose or new.expires_at is distinct from old.expires_at
      or (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at) then
      raise exception using errcode='23514', message='AUTH_SESSION_IMMUTABLE';
    end if;
  elsif tg_table_name = 'challenges' then
    if new.id is distinct from old.id or new.identity_id is distinct from old.identity_id
      or new.journey_id is distinct from old.journey_id or new.purpose is distinct from old.purpose
      or new.generation is distinct from old.generation or new.binding_hash is distinct from old.binding_hash
      or new.verifier_hash is distinct from old.verifier_hash or new.expires_at is distinct from old.expires_at
      or new.max_attempts is distinct from old.max_attempts or new.attempt_count < old.attempt_count
      or (old.consumed_at is not null and new.consumed_at is distinct from old.consumed_at) then
      raise exception using errcode='23514', message='AUTH_CHALLENGE_IMMUTABLE';
    end if;
  elsif tg_table_name = 'journey_transactions' then
    if new.id is distinct from old.id or new.identity_id is distinct from old.identity_id
      or new.purpose is distinct from old.purpose or new.binding_hash is distinct from old.binding_hash
      or new.secret_hash is distinct from old.secret_hash or new.expires_at is distinct from old.expires_at
      or (old.consumed_at is not null and new.consumed_at is distinct from old.consumed_at)
      or (old.state in ('COMMITTED','EXPIRED','CANCELLED') and new.state <> old.state) then
      raise exception using errcode='23514', message='AUTH_JOURNEY_IMMUTABLE';
    end if;
  elsif tg_table_name = 'command_ledger' then
    if new.command_id is distinct from old.command_id or new.idempotency_key is distinct from old.idempotency_key
      or new.intent_hash is distinct from old.intent_hash or new.command_type is distinct from old.command_type
      or new.actor_identity_id is distinct from old.actor_identity_id
      or new.target_identity_id is distinct from old.target_identity_id then
      raise exception using errcode='23514', message='AUTH_COMMAND_INTENT_IMMUTABLE';
    end if;
    if new.state <> old.state and not (
      (old.state='CLAIMED' and new.state in ('EFFECT_REQUESTED','FAILED_CONFIRMED'))
      or (old.state='EFFECT_REQUESTED' and new.state in ('EFFECT_CONFIRMED','FAILED_CONFIRMED','RECONCILIATION_REQUIRED'))
      or (old.state='EFFECT_CONFIRMED' and new.state in ('COMMITTED','RECONCILIATION_REQUIRED'))
      or (old.state='RECONCILIATION_REQUIRED' and new.state in ('EFFECT_CONFIRMED','FAILED_CONFIRMED'))
    ) then
      raise exception using errcode='23514', message='AUTH_COMMAND_TRANSITION_DENIED';
    end if;
  elsif tg_table_name = 'refresh_leases' then
    if new.session_id is distinct from old.session_id or new.fencing_token <= old.fencing_token then
      raise exception using errcode='23514', message='AUTH_LEASE_FENCE_INVALID';
    end if;
  elsif tg_table_name = 'identities' then
    if new.id is distinct from old.id or new.context_version < old.context_version then
      raise exception using errcode='23514', message='AUTH_IDENTITY_VERSION_INVALID';
    end if;
    if new.role is distinct from old.role and exists (
      select 1 from rmc_auth_private.assignments where identity_id=old.id
        and valid_until is null and role::text <> new.role
    ) then
      raise exception using errcode='23514', message='AUTH_ASSIGNMENT_ROLE_CONFLICT';
    end if;
  elsif tg_table_name = 'identity_lookups' then
    if new.identity_id is distinct from old.identity_id or new.lookup_type is distinct from old.lookup_type
      or new.key_version is distinct from old.key_version or new.lookup_hash is distinct from old.lookup_hash
      or (not old.is_current and new.is_current) then
      raise exception using errcode='23514', message='AUTH_LOOKUP_IMMUTABLE';
    end if;
  elsif tg_table_name = 'delivery_outbox' then
    if new.id is distinct from old.id or new.challenge_id is distinct from old.challenge_id
      or new.identity_id is distinct from old.identity_id or new.purpose is distinct from old.purpose
      or new.generation is distinct from old.generation or new.binding_hash is distinct from old.binding_hash
      or new.idempotency_key is distinct from old.idempotency_key then
      raise exception using errcode='23514', message='AUTH_DELIVERY_BINDING_IMMUTABLE';
    end if;
  end if;
  return new;
end
$function$;

create trigger sessions_authority_guard before update on rmc_auth_private.functional_sessions
  for each row execute function rmc_auth_private.guard_persisted_authority();
create trigger challenges_authority_guard before update on rmc_auth_private.challenges
  for each row execute function rmc_auth_private.guard_persisted_authority();
create trigger journeys_authority_guard before update on rmc_auth_private.journey_transactions
  for each row execute function rmc_auth_private.guard_persisted_authority();
create trigger commands_authority_guard before update on rmc_auth_private.command_ledger
  for each row execute function rmc_auth_private.guard_persisted_authority();
create trigger leases_authority_guard before update on rmc_auth_private.refresh_leases
  for each row execute function rmc_auth_private.guard_persisted_authority();
create trigger identities_authority_guard before update on rmc_auth_private.identities
  for each row execute function rmc_auth_private.guard_persisted_authority();
create trigger lookups_authority_guard before update on rmc_auth_private.identity_lookups
  for each row execute function rmc_auth_private.guard_persisted_authority();
create trigger delivery_authority_guard before update on rmc_auth_private.delivery_outbox
  for each row execute function rmc_auth_private.guard_persisted_authority();

create function rmc_auth_private.guard_assignment_history()
returns trigger language plpgsql security invoker set search_path=''
as $function$
declare identity_role text;
begin
  if tg_op='UPDATE' and (new.id is distinct from old.id or new.identity_id is distinct from old.identity_id
    or new.unit_id is distinct from old.unit_id or new.role is distinct from old.role
    or new.valid_from is distinct from old.valid_from or new.created_by_command_id is distinct from old.created_by_command_id
    or (old.valid_until is not null and (new.valid_until is distinct from old.valid_until
      or new.ended_by_command_id is distinct from old.ended_by_command_id))) then
    raise exception using errcode='23514',message='AUTH_ASSIGNMENT_HISTORY_IMMUTABLE';
  end if;
  select role into identity_role from rmc_auth_private.identities where id=new.identity_id for update;
  if new.valid_until is null and identity_role is distinct from new.role::text then
    raise exception using errcode='23514',message='AUTH_ASSIGNMENT_ROLE_CONFLICT';
  end if;
  return new;
end
$function$;
create trigger assignments_history_guard before insert or update on rmc_auth_private.assignments
  for each row execute function rmc_auth_private.guard_assignment_history();

-- NULL decoy bindings must match too: a nullable FK alone cannot guarantee that.
create function rmc_auth_private.guard_identity_binding()
returns trigger language plpgsql security invoker set search_path=''
as $function$
declare bound_identity uuid;
begin
  if tg_table_name='challenges' then
    select identity_id into bound_identity from rmc_auth_private.journey_transactions where id=new.journey_id for key share;
  else
    select identity_id into bound_identity from rmc_auth_private.challenges where id=new.challenge_id for key share;
  end if;
  if not found or bound_identity is distinct from new.identity_id then
    raise exception using errcode='23514',message='AUTH_IDENTITY_BINDING_INVALID';
  end if;
  return new;
end
$function$;
create trigger challenges_identity_binding before insert or update on rmc_auth_private.challenges
  for each row execute function rmc_auth_private.guard_identity_binding();
create trigger delivery_identity_binding before insert or update on rmc_auth_private.delivery_outbox
  for each row execute function rmc_auth_private.guard_identity_binding();

-- Caller clocks are removed from the exposed signatures.
drop function rmc_auth_api.consume_challenge(uuid,bigint,timestamptz);
create function rmc_auth_api.consume_challenge(p_challenge_id uuid, p_generation bigint)
returns boolean language plpgsql security invoker set search_path = ''
as $function$
declare
  candidate rmc_auth_private.challenges%rowtype;
  journey rmc_auth_private.journey_transactions%rowtype;
  current_identity rmc_auth_private.identities%rowtype;
  server_now timestamptz;
begin
  if p_challenge_id is null or p_generation is null or p_generation < 1 then return false; end if;
  select * into candidate from rmc_auth_private.challenges where id=p_challenge_id;
  if not found then return false; end if;
  -- Lock order: identity -> journey -> challenge. External work never happens in this transaction.
  if candidate.identity_id is not null then
    select * into current_identity from rmc_auth_private.identities
      where id=candidate.identity_id for update;
    if not found or current_identity.lifecycle not in ('PENDING','ACTIVE') then return false; end if;
  end if;
  select * into journey from rmc_auth_private.journey_transactions
    where id=candidate.journey_id for update;
  select * into candidate from rmc_auth_private.challenges where id=p_challenge_id for update;
  server_now := clock_timestamp();
  if candidate.id is null or journey.id is null or journey.state <> 'PENDING' or journey.consumed_at is not null
    or (candidate.identity_id is not null and current_identity.generation <> journey.identity_generation)
    or journey.identity_id is distinct from candidate.identity_id
    or journey.purpose <> candidate.purpose or journey.binding_hash <> candidate.binding_hash
    or journey.generation <> p_generation or candidate.generation <> p_generation
    or journey.expires_at <= server_now or candidate.expires_at <= server_now
    or candidate.consumed_at is not null or candidate.attempt_count >= candidate.max_attempts then
    return false;
  end if;
  update rmc_auth_private.challenges set consumed_at=server_now where id=p_challenge_id;
  return true;
end
$function$;

drop function rmc_auth_api.acquire_refresh_lease(uuid,uuid,bigint,integer,timestamptz);
create function rmc_auth_api.acquire_refresh_lease(
  p_session_id uuid, p_owner_id uuid, p_generation bigint, p_lease_seconds integer
) returns table (acquired boolean, fencing_token bigint)
language plpgsql security invoker set search_path = ''
as $function$
declare
  identity_id uuid;
  active_identity rmc_auth_private.identities%rowtype;
  active_session rmc_auth_private.functional_sessions%rowtype;
  server_now timestamptz;
  current_token bigint;
begin
  if p_session_id is null or p_owner_id is null or p_generation is null or p_generation < 1
    or p_lease_seconds is null or p_lease_seconds < 1 or p_lease_seconds > 60 then
    raise exception using errcode='22023', message='AUTH_LEASE_ARGUMENT_INVALID';
  end if;
  select s.identity_id into identity_id from rmc_auth_private.functional_sessions s where s.id=p_session_id;
  if not found then return query select false, null::bigint; return; end if;
  select * into active_identity from rmc_auth_private.identities i where i.id=identity_id for update;
  select * into active_session from rmc_auth_private.functional_sessions s where s.id=p_session_id for update;
  server_now := clock_timestamp();
  if active_identity.id is null or active_session.id is null
    or active_identity.lifecycle <> 'ACTIVE' or active_identity.onboarding <> 'COMPLETE'
    or active_session.purpose <> 'NORMAL' or active_session.revoked_at is not null
    or active_session.generation <> p_generation or active_session.identity_generation <> active_identity.generation
    or active_session.expires_at <= server_now or active_session.idle_expires_at <= server_now then
    return query select false, null::bigint; return;
  end if;
  insert into rmc_auth_private.refresh_leases (session_id,owner_id,generation,fencing_token,expires_at,acquired_at)
    values (p_session_id,p_owner_id,p_generation,1,server_now+make_interval(secs=>p_lease_seconds),server_now)
  on conflict (session_id) do update
    set owner_id=excluded.owner_id, generation=excluded.generation,
      fencing_token=rmc_auth_private.refresh_leases.fencing_token+1,
      expires_at=excluded.expires_at, acquired_at=excluded.acquired_at
    where rmc_auth_private.refresh_leases.expires_at <= server_now
      and rmc_auth_private.refresh_leases.generation <= excluded.generation
    returning rmc_auth_private.refresh_leases.fencing_token into current_token;
  return query select current_token is not null, current_token;
end
$function$;

create or replace function rmc_auth_api.claim_command(
  p_command_id uuid, p_idempotency_key uuid, p_intent_hash bytea, p_command_type text,
  p_actor_identity_id uuid default null, p_target_identity_id uuid default null
) returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare
  claimed rmc_auth_private.command_ledger%rowtype;
begin
  if p_command_id is null or p_idempotency_key is null or p_intent_hash is null
    or octet_length(p_intent_hash) <> 32 or p_command_type is null
    or p_command_type !~ '^[A-Z][A-Z0-9_]{0,63}$' then
    raise exception using errcode='22023', message='AUTH_COMMAND_INVALID';
  end if;
  insert into rmc_auth_private.command_ledger
    (command_id,idempotency_key,intent_hash,command_type,actor_identity_id,target_identity_id)
    values (p_command_id,p_idempotency_key,p_intent_hash,p_command_type,p_actor_identity_id,p_target_identity_id)
    on conflict (idempotency_key) do nothing;
  select * into claimed from rmc_auth_private.command_ledger where idempotency_key=p_idempotency_key;
  if claimed.intent_hash is distinct from p_intent_hash or claimed.command_type is distinct from p_command_type
    or claimed.actor_identity_id is distinct from p_actor_identity_id
    or claimed.target_identity_id is distinct from p_target_identity_id then
    raise exception using errcode='23505', message='AUTH_IDEMPOTENCY_CONFLICT';
  end if;
  return jsonb_build_object('commandId',claimed.command_id,'state',claimed.state,
    'generation',claimed.generation,'resultCode',claimed.result_code,'result',claimed.result_payload);
end
$function$;

create function rmc_auth_api.create_delivery_challenge(
  p_challenge_id uuid, p_journey_id uuid, p_generation bigint, p_verifier_hash bytea,
  p_ciphertext bytea, p_key_version integer, p_expires_at timestamptz, p_max_attempts integer,
  p_outbox_id uuid, p_envelope_ciphertext bytea, p_delivery_key_version integer, p_idempotency_key uuid
) returns uuid language plpgsql security invoker set search_path = ''
as $function$
declare
  journey rmc_auth_private.journey_transactions%rowtype;
  current_identity rmc_auth_private.identities%rowtype;
  server_now timestamptz;
begin
  select * into journey from rmc_auth_private.journey_transactions where id=p_journey_id;
  if journey.identity_id is not null then
    select * into current_identity from rmc_auth_private.identities where id=journey.identity_id for update;
    if current_identity.lifecycle not in ('PENDING','ACTIVE') then
      raise exception using errcode='22023', message='AUTH_CHALLENGE_CONTEXT_INVALID';
    end if;
  end if;
  select * into journey from rmc_auth_private.journey_transactions where id=p_journey_id for update;
  server_now := clock_timestamp();
  if journey.id is null or journey.state <> 'PENDING' or journey.consumed_at is not null
    or (journey.identity_id is not null and journey.identity_generation <> current_identity.generation)
    or journey.purpose not in ('PREAUTH','RECOVERY') or journey.generation <> p_generation
    or journey.expires_at <= server_now or p_expires_at is null or p_expires_at <= server_now
    or p_expires_at > journey.expires_at or p_expires_at > server_now+interval '10 minutes'
    or p_generation is null or p_max_attempts is null or p_max_attempts not between 1 and 5 then
    raise exception using errcode='22023', message='AUTH_CHALLENGE_CONTEXT_INVALID';
  end if;
  insert into rmc_auth_private.challenges
    (id,journey_id,identity_id,purpose,verifier_hash,ciphertext,key_version,binding_hash,
      generation,max_attempts,expires_at)
    values (p_challenge_id,p_journey_id,journey.identity_id,journey.purpose,p_verifier_hash,
      p_ciphertext,p_key_version,journey.binding_hash,p_generation,p_max_attempts,p_expires_at);
  insert into rmc_auth_private.delivery_outbox
    (id,challenge_id,identity_id,purpose,envelope_ciphertext,key_version,binding_hash,
      idempotency_key,generation,max_attempts)
    values (p_outbox_id,p_challenge_id,journey.identity_id,journey.purpose,p_envelope_ciphertext,
      p_delivery_key_version,journey.binding_hash,p_idempotency_key,p_generation,5);
  return p_outbox_id;
end
$function$;

-- Grant only the relations and actions used by the current invoker RPCs.
revoke all on all tables in schema rmc_auth_private from service_role;
revoke all on all sequences in schema rmc_auth_private from service_role;
grant select on rmc_auth_private.identities, rmc_auth_private.functional_sessions,
  rmc_auth_private.journey_transactions to service_role;
grant update (id) on rmc_auth_private.identities, rmc_auth_private.functional_sessions,
  rmc_auth_private.journey_transactions to service_role;
grant select, insert, update on rmc_auth_private.challenges to service_role;
grant insert on rmc_auth_private.delivery_outbox to service_role;
grant select, insert on rmc_auth_private.command_ledger to service_role;
grant select, insert, update on rmc_auth_private.refresh_leases to service_role;
revoke all on all functions in schema rmc_auth_api from public, anon, authenticated;
grant execute on function rmc_auth_api.consume_challenge(uuid,bigint) to service_role;
grant execute on function rmc_auth_api.acquire_refresh_lease(uuid,uuid,bigint,integer) to service_role;
grant execute on function rmc_auth_api.create_delivery_challenge(uuid,uuid,bigint,bytea,bytea,integer,timestamptz,integer,uuid,bytea,integer,uuid) to service_role;
