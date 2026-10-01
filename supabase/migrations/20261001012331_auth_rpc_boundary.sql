create function rmc_auth_api.claim_command(
  p_command_id uuid,
  p_idempotency_key uuid,
  p_intent_hash bytea,
  p_command_type text,
  p_actor_identity_id uuid default null,
  p_target_identity_id uuid default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  claimed rmc_auth_private.command_ledger%rowtype;
begin
  if p_command_type is null or p_command_type = '' or octet_length(p_intent_hash) < 16 then
    raise exception using errcode = '22023', message = 'AUTH_COMMAND_INVALID';
  end if;

  insert into rmc_auth_private.command_ledger (
    command_id, idempotency_key, intent_hash, command_type,
    actor_identity_id, target_identity_id
  ) values (
    p_command_id, p_idempotency_key, p_intent_hash, p_command_type,
    p_actor_identity_id, p_target_identity_id
  )
  on conflict (idempotency_key) do nothing;

  select * into claimed
  from rmc_auth_private.command_ledger
  where idempotency_key = p_idempotency_key;

  if claimed.intent_hash <> p_intent_hash
     or claimed.command_type <> p_command_type
     or claimed.actor_identity_id is distinct from p_actor_identity_id
     or claimed.target_identity_id is distinct from p_target_identity_id then
    raise exception using errcode = '23505', message = 'AUTH_IDEMPOTENCY_CONFLICT';
  end if;

  return jsonb_build_object(
    'commandId', claimed.command_id,
    'state', claimed.state,
    'generation', claimed.generation,
    'resultCode', claimed.result_code,
    'result', claimed.result_payload
  );
end
$function$;

create function rmc_auth_api.consume_challenge(
  p_challenge_id uuid,
  p_generation bigint,
  p_consumed_at timestamptz default clock_timestamp()
) returns boolean
language sql
security invoker
set search_path = ''
as $function$
  with consumed as (
    update rmc_auth_private.challenges
    set consumed_at = p_consumed_at
    where id = p_challenge_id
      and generation = p_generation
      and consumed_at is null
      and expires_at > p_consumed_at
    returning id
  )
  select exists (select 1 from consumed);
$function$;

create function rmc_auth_api.acquire_refresh_lease(
  p_session_id uuid,
  p_owner_id uuid,
  p_generation bigint,
  p_lease_seconds integer,
  p_now timestamptz default clock_timestamp()
) returns table (acquired boolean, fencing_token bigint)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  current_token bigint;
begin
  if p_lease_seconds < 1 or p_lease_seconds > 60 then
    raise exception using errcode = '22023', message = 'AUTH_LEASE_DURATION_INVALID';
  end if;

  insert into rmc_auth_private.refresh_leases (
    session_id, owner_id, generation, fencing_token, expires_at, acquired_at
  ) values (
    p_session_id, p_owner_id, p_generation, 1,
    p_now + make_interval(secs => p_lease_seconds), p_now
  )
  on conflict (session_id) do update
  set owner_id = excluded.owner_id,
      generation = excluded.generation,
      fencing_token = rmc_auth_private.refresh_leases.fencing_token + 1,
      expires_at = excluded.expires_at,
      acquired_at = excluded.acquired_at
  where rmc_auth_private.refresh_leases.expires_at <= p_now
    and rmc_auth_private.refresh_leases.generation <= excluded.generation
  returning rmc_auth_private.refresh_leases.fencing_token into current_token;

  return query select current_token is not null, current_token;
end
$function$;

revoke execute on function rmc_auth_api.claim_command(uuid, uuid, bytea, text, uuid, uuid)
  from public, anon, authenticated;
revoke execute on function rmc_auth_api.consume_challenge(uuid, bigint, timestamptz)
  from public, anon, authenticated;
revoke execute on function rmc_auth_api.acquire_refresh_lease(uuid, uuid, bigint, integer, timestamptz)
  from public, anon, authenticated;

grant usage on schema rmc_auth_api to service_role;
grant execute on function rmc_auth_api.claim_command(uuid, uuid, bytea, text, uuid, uuid) to service_role;
grant execute on function rmc_auth_api.consume_challenge(uuid, bigint, timestamptz) to service_role;
grant execute on function rmc_auth_api.acquire_refresh_lease(uuid, uuid, bigint, integer, timestamptz) to service_role;
