


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "rmc_auth_api";


ALTER SCHEMA "rmc_auth_api" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rmc_auth_api"."acquire_refresh_lease"("p_session_id" "uuid", "p_owner_id" "uuid", "p_generation" bigint, "p_lease_seconds" integer, "p_now" timestamp with time zone DEFAULT "clock_timestamp"()) RETURNS TABLE("acquired" boolean, "fencing_token" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "rmc_auth_api"."acquire_refresh_lease"("p_session_id" "uuid", "p_owner_id" "uuid", "p_generation" bigint, "p_lease_seconds" integer, "p_now" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rmc_auth_api"."claim_command"("p_command_id" "uuid", "p_idempotency_key" "uuid", "p_intent_hash" "bytea", "p_command_type" "text", "p_actor_identity_id" "uuid" DEFAULT NULL::"uuid", "p_target_identity_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "rmc_auth_api"."claim_command"("p_command_id" "uuid", "p_idempotency_key" "uuid", "p_intent_hash" "bytea", "p_command_type" "text", "p_actor_identity_id" "uuid", "p_target_identity_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rmc_auth_api"."consume_challenge"("p_challenge_id" "uuid", "p_generation" bigint, "p_consumed_at" timestamp with time zone DEFAULT "clock_timestamp"()) RETURNS boolean
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "rmc_auth_api"."consume_challenge"("p_challenge_id" "uuid", "p_generation" bigint, "p_consumed_at" timestamp with time zone) OWNER TO "postgres";


GRANT USAGE ON SCHEMA "rmc_auth_api" TO "service_role";



REVOKE ALL ON FUNCTION "rmc_auth_api"."acquire_refresh_lease"("p_session_id" "uuid", "p_owner_id" "uuid", "p_generation" bigint, "p_lease_seconds" integer, "p_now" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "rmc_auth_api"."acquire_refresh_lease"("p_session_id" "uuid", "p_owner_id" "uuid", "p_generation" bigint, "p_lease_seconds" integer, "p_now" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "rmc_auth_api"."claim_command"("p_command_id" "uuid", "p_idempotency_key" "uuid", "p_intent_hash" "bytea", "p_command_type" "text", "p_actor_identity_id" "uuid", "p_target_identity_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "rmc_auth_api"."claim_command"("p_command_id" "uuid", "p_idempotency_key" "uuid", "p_intent_hash" "bytea", "p_command_type" "text", "p_actor_identity_id" "uuid", "p_target_identity_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "rmc_auth_api"."consume_challenge"("p_challenge_id" "uuid", "p_generation" bigint, "p_consumed_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "rmc_auth_api"."consume_challenge"("p_challenge_id" "uuid", "p_generation" bigint, "p_consumed_at" timestamp with time zone) TO "service_role";
