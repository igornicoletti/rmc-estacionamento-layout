


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


CREATE OR REPLACE FUNCTION "rmc_auth_api"."acquire_refresh_lease"("p_session_id" "uuid", "p_owner_id" "uuid", "p_generation" bigint, "p_lease_seconds" integer) RETURNS TABLE("acquired" boolean, "fencing_token" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "rmc_auth_api"."acquire_refresh_lease"("p_session_id" "uuid", "p_owner_id" "uuid", "p_generation" bigint, "p_lease_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rmc_auth_api"."claim_command"("p_command_id" "uuid", "p_idempotency_key" "uuid", "p_intent_hash" "bytea", "p_command_type" "text", "p_actor_identity_id" "uuid" DEFAULT NULL::"uuid", "p_target_identity_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "rmc_auth_api"."claim_command"("p_command_id" "uuid", "p_idempotency_key" "uuid", "p_intent_hash" "bytea", "p_command_type" "text", "p_actor_identity_id" "uuid", "p_target_identity_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rmc_auth_api"."consume_challenge"("p_challenge_id" "uuid", "p_generation" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "rmc_auth_api"."consume_challenge"("p_challenge_id" "uuid", "p_generation" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rmc_auth_api"."create_delivery_challenge"("p_challenge_id" "uuid", "p_journey_id" "uuid", "p_generation" bigint, "p_verifier_hash" "bytea", "p_ciphertext" "bytea", "p_key_version" integer, "p_expires_at" timestamp with time zone, "p_max_attempts" integer, "p_outbox_id" "uuid", "p_envelope_ciphertext" "bytea", "p_delivery_key_version" integer, "p_idempotency_key" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "rmc_auth_api"."create_delivery_challenge"("p_challenge_id" "uuid", "p_journey_id" "uuid", "p_generation" bigint, "p_verifier_hash" "bytea", "p_ciphertext" "bytea", "p_key_version" integer, "p_expires_at" timestamp with time zone, "p_max_attempts" integer, "p_outbox_id" "uuid", "p_envelope_ciphertext" "bytea", "p_delivery_key_version" integer, "p_idempotency_key" "uuid") OWNER TO "postgres";


GRANT USAGE ON SCHEMA "rmc_auth_api" TO "service_role";



REVOKE ALL ON FUNCTION "rmc_auth_api"."acquire_refresh_lease"("p_session_id" "uuid", "p_owner_id" "uuid", "p_generation" bigint, "p_lease_seconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "rmc_auth_api"."acquire_refresh_lease"("p_session_id" "uuid", "p_owner_id" "uuid", "p_generation" bigint, "p_lease_seconds" integer) TO "service_role";



REVOKE ALL ON FUNCTION "rmc_auth_api"."claim_command"("p_command_id" "uuid", "p_idempotency_key" "uuid", "p_intent_hash" "bytea", "p_command_type" "text", "p_actor_identity_id" "uuid", "p_target_identity_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "rmc_auth_api"."claim_command"("p_command_id" "uuid", "p_idempotency_key" "uuid", "p_intent_hash" "bytea", "p_command_type" "text", "p_actor_identity_id" "uuid", "p_target_identity_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "rmc_auth_api"."consume_challenge"("p_challenge_id" "uuid", "p_generation" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "rmc_auth_api"."consume_challenge"("p_challenge_id" "uuid", "p_generation" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "rmc_auth_api"."create_delivery_challenge"("p_challenge_id" "uuid", "p_journey_id" "uuid", "p_generation" bigint, "p_verifier_hash" "bytea", "p_ciphertext" "bytea", "p_key_version" integer, "p_expires_at" timestamp with time zone, "p_max_attempts" integer, "p_outbox_id" "uuid", "p_envelope_ciphertext" "bytea", "p_delivery_key_version" integer, "p_idempotency_key" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "rmc_auth_api"."create_delivery_challenge"("p_challenge_id" "uuid", "p_journey_id" "uuid", "p_generation" bigint, "p_verifier_hash" "bytea", "p_ciphertext" "bytea", "p_key_version" integer, "p_expires_at" timestamp with time zone, "p_max_attempts" integer, "p_outbox_id" "uuid", "p_envelope_ciphertext" "bytea", "p_delivery_key_version" integer, "p_idempotency_key" "uuid") TO "service_role";
