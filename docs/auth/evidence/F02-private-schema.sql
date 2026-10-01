


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


CREATE SCHEMA IF NOT EXISTS "rmc_auth_private";


ALTER SCHEMA "rmc_auth_private" OWNER TO "postgres";


CREATE TYPE "rmc_auth_private"."assignment_role" AS ENUM (
    'M',
    'O'
);


ALTER TYPE "rmc_auth_private"."assignment_role" OWNER TO "postgres";


CREATE TYPE "rmc_auth_private"."assurance_level" AS ENUM (
    'aal1',
    'aal2'
);


ALTER TYPE "rmc_auth_private"."assurance_level" OWNER TO "postgres";


CREATE TYPE "rmc_auth_private"."authority_purpose" AS ENUM (
    'PREAUTH',
    'MFA_PENDING',
    'BOOTSTRAP',
    'RECOVERY',
    'NORMAL'
);


ALTER TYPE "rmc_auth_private"."authority_purpose" OWNER TO "postgres";


CREATE TYPE "rmc_auth_private"."command_state" AS ENUM (
    'CLAIMED',
    'EFFECT_REQUESTED',
    'EFFECT_CONFIRMED',
    'COMMITTED',
    'FAILED_CONFIRMED',
    'RECONCILIATION_REQUIRED'
);


ALTER TYPE "rmc_auth_private"."command_state" OWNER TO "postgres";


CREATE TYPE "rmc_auth_private"."delivery_state" AS ENUM (
    'PENDING',
    'CLAIMED',
    'PUBLISHED',
    'DELIVERED',
    'FAILED',
    'DEAD_LETTER'
);


ALTER TYPE "rmc_auth_private"."delivery_state" OWNER TO "postgres";


CREATE TYPE "rmc_auth_private"."identity_lifecycle" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'BLOCKED',
    'DISABLED',
    'DELETED'
);


ALTER TYPE "rmc_auth_private"."identity_lifecycle" OWNER TO "postgres";


CREATE TYPE "rmc_auth_private"."onboarding_state" AS ENUM (
    'ACTIVATION_REQUIRED',
    'PASSWORD_REQUIRED',
    'SECURITY_SETUP',
    'COMPLETE'
);


ALTER TYPE "rmc_auth_private"."onboarding_state" OWNER TO "postgres";


CREATE TYPE "rmc_auth_private"."reconciliation_state" AS ENUM (
    'PENDING',
    'CLAIMED',
    'RESOLVED',
    'ESCALATED'
);


ALTER TYPE "rmc_auth_private"."reconciliation_state" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rmc_auth_private"."guard_assignment_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "rmc_auth_private"."guard_assignment_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rmc_auth_private"."guard_identity_binding"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "rmc_auth_private"."guard_identity_binding"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rmc_auth_private"."guard_persisted_authority"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "rmc_auth_private"."guard_persisted_authority"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rmc_auth_private"."reject_generation_regression"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.generation < old.generation then
    raise exception using errcode = '23514', message = 'AUTH_GENERATION_REGRESSION';
  end if;
  return new;
end
$$;


ALTER FUNCTION "rmc_auth_private"."reject_generation_regression"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identity_id" "uuid" NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "role" "rmc_auth_private"."assignment_role" NOT NULL,
    "valid_from" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "valid_until" timestamp with time zone,
    "created_by_command_id" "uuid" NOT NULL,
    "ended_by_command_id" "uuid",
    CONSTRAINT "assignments_check" CHECK ((("valid_until" IS NULL) OR ("valid_until" > "valid_from"))),
    CONSTRAINT "assignments_check1" CHECK ((("valid_until" IS NULL) = ("ended_by_command_id" IS NULL))),
    CONSTRAINT "assignments_created_by_command_id_v4" CHECK ((("created_by_command_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "assignments_ended_by_command_id_v4" CHECK ((("ended_by_command_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "assignments_id_v4" CHECK ((("id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "assignments_identity_id_v4" CHECK ((("identity_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "assignments_unit_id_v4" CHECK ((("unit_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text"))
);

ALTER TABLE ONLY "rmc_auth_private"."assignments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "request_id" "text" NOT NULL,
    "command_id" "uuid",
    "identity_id" "uuid",
    "purpose" "rmc_auth_private"."authority_purpose",
    "generation" bigint,
    "capability" "text",
    "outcome" "text" NOT NULL,
    "reason_code" "text" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "contract_version" "text" DEFAULT '1.0'::"text" NOT NULL,
    "deployment_id" "text" NOT NULL,
    CONSTRAINT "audit_capability_allowlist" CHECK (("capability" = ANY (ARRAY['users.read'::"text", 'users.create'::"text", 'users.update_profile'::"text", 'users.change_role'::"text", 'users.change_unit'::"text", 'users.resend_activation'::"text", 'users.start_recovery'::"text", 'users.suspend'::"text", 'users.resume'::"text", 'users.block'::"text", 'users.unblock'::"text", 'users.disable'::"text", 'users.reactivate'::"text", 'users.end_session'::"text", 'users.reset_mfa'::"text", 'users.audit.read'::"text", 'users.cpf.reveal'::"text"]))),
    CONSTRAINT "audit_contract_version" CHECK (("contract_version" = '1.0'::"text")),
    CONSTRAINT "audit_deployment_bounded" CHECK (("deployment_id" ~ '^[A-Za-z0-9_.-]{1,128}$'::"text")),
    CONSTRAINT "audit_events_command_id_v4" CHECK ((("command_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "audit_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['AUTH_LOGIN_OUTCOME'::"text", 'MFA_OUTCOME'::"text", 'SESSION_REVOKED'::"text", 'SESSION_REFRESH_OUTCOME'::"text", 'CHALLENGE_REQUESTED'::"text", 'CHALLENGE_VERIFIED'::"text", 'RECOVERY_OUTCOME'::"text", 'ADMIN_COMMAND_OUTCOME'::"text", 'DELIVERY_OUTCOME'::"text", 'RECONCILIATION_REQUIRED'::"text", 'RECONCILIATION_RESOLVED'::"text"]))),
    CONSTRAINT "audit_events_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "audit_events_id_v4" CHECK ((("id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "audit_events_identity_id_v4" CHECK ((("identity_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "audit_events_outcome_check" CHECK (("outcome" = ANY (ARRAY['ALLOW'::"text", 'DENY'::"text", 'SUCCESS'::"text", 'FAILURE'::"text", 'UNKNOWN'::"text"]))),
    CONSTRAINT "audit_events_reason_code_check" CHECK (("reason_code" <> ''::"text")),
    CONSTRAINT "audit_events_request_id_check" CHECK (("request_id" <> ''::"text")),
    CONSTRAINT "audit_reason_allowlist" CHECK (("reason_code" = ANY (ARRAY['VERIFIED'::"text", 'REVOKED'::"text", 'COMMITTED'::"text", 'ACCEPTED'::"text", 'DELIVERED'::"text", 'EXPIRED'::"text", 'STALE'::"text", 'RECONCILIATION_REQUIRED'::"text", 'AUTH_INVALID_REQUEST'::"text", 'AUTH_SESSION_INVALID'::"text", 'AUTH_CREDENTIALS_INVALID'::"text", 'AUTH_ORIGIN_DENIED'::"text", 'AUTH_CSRF_INVALID'::"text", 'AUTH_ACCESS_DENIED'::"text", 'AUTH_STEP_UP_REQUIRED'::"text", 'RESOURCE_NOT_FOUND'::"text", 'AUTH_STATE_CONFLICT'::"text", 'AUTH_BODY_TOO_LARGE'::"text", 'AUTH_UNSUPPORTED_MEDIA_TYPE'::"text", 'AUTH_RATE_LIMITED'::"text", 'AUTH_CONFIGURATION_ERROR'::"text", 'AUTH_UNEXPECTED_ERROR'::"text", 'AUTH_PROVIDER_FAILURE'::"text", 'AUTH_DEPENDENCY_UNAVAILABLE'::"text", 'AUTH_DEPENDENCY_TIMEOUT'::"text"]))),
    CONSTRAINT "audit_request_bounded" CHECK (("request_id" ~ '^[A-Za-z0-9_-]{8,128}$'::"text"))
);

ALTER TABLE ONLY "rmc_auth_private"."audit_events" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."audit_outbox" (
    "event_id" "uuid" NOT NULL,
    "state" "rmc_auth_private"."delivery_state" DEFAULT 'PENDING'::"rmc_auth_private"."delivery_state" NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "next_attempt_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "lease_owner" "uuid",
    "lease_expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "audit_outbox_attempt_count_check" CHECK (("attempt_count" >= 0)),
    CONSTRAINT "audit_outbox_check" CHECK ((("lease_owner" IS NULL) = ("lease_expires_at" IS NULL))),
    CONSTRAINT "audit_outbox_event_id_v4" CHECK ((("event_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "audit_outbox_lease_owner_v4" CHECK ((("lease_owner")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text"))
);

ALTER TABLE ONLY "rmc_auth_private"."audit_outbox" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."audit_outbox" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journey_id" "uuid" NOT NULL,
    "identity_id" "uuid",
    "purpose" "rmc_auth_private"."authority_purpose" NOT NULL,
    "verifier_hash" "bytea" NOT NULL,
    "ciphertext" "bytea" NOT NULL,
    "key_version" integer NOT NULL,
    "binding_hash" "bytea" NOT NULL,
    "generation" bigint NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "consumed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "challenges_attempt_count_check" CHECK (("attempt_count" >= 0)),
    CONSTRAINT "challenges_binding_sha256" CHECK (("octet_length"("binding_hash") = 32)),
    CONSTRAINT "challenges_check" CHECK (("attempt_count" <= "max_attempts")),
    CONSTRAINT "challenges_envelope_size" CHECK (("octet_length"("ciphertext") >= 29)),
    CONSTRAINT "challenges_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "challenges_id_v4" CHECK ((("id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "challenges_identity_id_v4" CHECK ((("identity_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "challenges_journey_id_v4" CHECK ((("journey_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "challenges_key_version_check" CHECK (("key_version" > 0)),
    CONSTRAINT "challenges_max_attempts_check" CHECK (("max_attempts" > 0)),
    CONSTRAINT "challenges_valid_times" CHECK (("expires_at" > "created_at")),
    CONSTRAINT "challenges_verifier_sha256" CHECK (("octet_length"("verifier_hash") = 32))
);

ALTER TABLE ONLY "rmc_auth_private"."challenges" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."command_ledger" (
    "command_id" "uuid" NOT NULL,
    "idempotency_key" "uuid" NOT NULL,
    "intent_hash" "bytea" NOT NULL,
    "actor_identity_id" "uuid",
    "target_identity_id" "uuid",
    "command_type" "text" NOT NULL,
    "state" "rmc_auth_private"."command_state" DEFAULT 'CLAIMED'::"rmc_auth_private"."command_state" NOT NULL,
    "generation" bigint DEFAULT 1 NOT NULL,
    "result_code" "text",
    "result_payload" "jsonb",
    "reconcile_after" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "command_ledger_actor_identity_id_v4" CHECK ((("actor_identity_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "command_ledger_command_id_v4" CHECK ((("command_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "command_ledger_command_type_check" CHECK (("command_type" <> ''::"text")),
    CONSTRAINT "command_ledger_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "command_ledger_idempotency_key_v4" CHECK ((("idempotency_key")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "command_ledger_result_payload_check" CHECK ((("result_payload" IS NULL) OR ("jsonb_typeof"("result_payload") = 'object'::"text"))),
    CONSTRAINT "command_ledger_target_identity_id_v4" CHECK ((("target_identity_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "commands_intent_sha256" CHECK (("octet_length"("intent_hash") = 32)),
    CONSTRAINT "commands_result_code_bounded" CHECK (("result_code" ~ '^[A-Z][A-Z0-9_]{0,63}$'::"text")),
    CONSTRAINT "commands_result_sanitized" CHECK ((("result_payload" IS NULL) OR ("result_payload" = '{}'::"jsonb"))),
    CONSTRAINT "commands_type_bounded" CHECK (("command_type" ~ '^[A-Z][A-Z0-9_]{0,63}$'::"text"))
);

ALTER TABLE ONLY "rmc_auth_private"."command_ledger" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."command_ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."delivery_attempts" (
    "id" bigint NOT NULL,
    "outbox_id" "uuid" NOT NULL,
    "attempt_number" integer NOT NULL,
    "provider_outcome" "text" NOT NULL,
    "provider_message_id" "text",
    "attempted_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "delivery_attempts_attempt_number_check" CHECK (("attempt_number" > 0)),
    CONSTRAINT "delivery_attempts_outbox_id_v4" CHECK ((("outbox_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "delivery_attempts_provider_outcome_check" CHECK (("provider_outcome" = ANY (ARRAY['ACCEPTED'::"text", 'REJECTED'::"text", 'UNKNOWN'::"text", 'STALE'::"text"])))
);

ALTER TABLE ONLY "rmc_auth_private"."delivery_attempts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."delivery_attempts" OWNER TO "postgres";


ALTER TABLE "rmc_auth_private"."delivery_attempts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "rmc_auth_private"."delivery_attempts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "rmc_auth_private"."delivery_outbox" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "identity_id" "uuid",
    "purpose" "rmc_auth_private"."authority_purpose" NOT NULL,
    "envelope_ciphertext" "bytea" NOT NULL,
    "key_version" integer NOT NULL,
    "binding_hash" "bytea" NOT NULL,
    "idempotency_key" "uuid" NOT NULL,
    "generation" bigint NOT NULL,
    "state" "rmc_auth_private"."delivery_state" DEFAULT 'PENDING'::"rmc_auth_private"."delivery_state" NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer NOT NULL,
    "next_attempt_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "lease_owner" "uuid",
    "lease_expires_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "delivery_binding_sha256" CHECK (("octet_length"("binding_hash") = 32)),
    CONSTRAINT "delivery_envelope_size" CHECK (("octet_length"("envelope_ciphertext") >= 29)),
    CONSTRAINT "delivery_outbox_attempt_count_check" CHECK (("attempt_count" >= 0)),
    CONSTRAINT "delivery_outbox_challenge_id_v4" CHECK ((("challenge_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "delivery_outbox_check" CHECK ((("lease_owner" IS NULL) = ("lease_expires_at" IS NULL))),
    CONSTRAINT "delivery_outbox_check1" CHECK (("attempt_count" <= "max_attempts")),
    CONSTRAINT "delivery_outbox_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "delivery_outbox_id_v4" CHECK ((("id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "delivery_outbox_idempotency_key_v4" CHECK ((("idempotency_key")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "delivery_outbox_identity_id_v4" CHECK ((("identity_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "delivery_outbox_key_version_check" CHECK (("key_version" > 0)),
    CONSTRAINT "delivery_outbox_lease_owner_v4" CHECK ((("lease_owner")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "delivery_outbox_max_attempts_check" CHECK (("max_attempts" > 0))
);

ALTER TABLE ONLY "rmc_auth_private"."delivery_outbox" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."delivery_outbox" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."functional_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identity_id" "uuid" NOT NULL,
    "purpose" "rmc_auth_private"."authority_purpose" NOT NULL,
    "assurance" "rmc_auth_private"."assurance_level" NOT NULL,
    "cookie_hash" "bytea" NOT NULL,
    "provider_refresh_ciphertext" "bytea",
    "key_version" integer NOT NULL,
    "generation" bigint NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "idle_expires_at" timestamp with time zone NOT NULL,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "identity_generation" bigint DEFAULT 1 NOT NULL,
    "refresh_binding_hash" "bytea",
    "refresh_key_version" integer,
    "refresh_purpose" "text",
    CONSTRAINT "functional_sessions_check" CHECK (("idle_expires_at" <= "expires_at")),
    CONSTRAINT "functional_sessions_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "functional_sessions_id_v4" CHECK ((("id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "functional_sessions_identity_generation_check" CHECK (("identity_generation" > 0)),
    CONSTRAINT "functional_sessions_identity_id_v4" CHECK ((("identity_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "functional_sessions_key_version_check" CHECK (("key_version" > 0)),
    CONSTRAINT "sessions_cookie_sha256" CHECK (("octet_length"("cookie_hash") = 32)),
    CONSTRAINT "sessions_refresh_envelope" CHECK (((("provider_refresh_ciphertext" IS NULL) AND ("refresh_binding_hash" IS NULL) AND ("refresh_key_version" IS NULL) AND ("refresh_purpose" IS NULL)) OR (("provider_refresh_ciphertext" IS NOT NULL) AND ("octet_length"("provider_refresh_ciphertext") >= 29) AND ("refresh_binding_hash" IS NOT NULL) AND ("octet_length"("refresh_binding_hash") = 32) AND ("refresh_key_version" IS NOT NULL) AND ("refresh_key_version" > 0) AND ("refresh_purpose" IS NOT NULL) AND ("refresh_purpose" = 'PROVIDER_REFRESH'::"text")))),
    CONSTRAINT "sessions_valid_times" CHECK ((("expires_at" > "created_at") AND ("idle_expires_at" > "created_at")))
);

ALTER TABLE ONLY "rmc_auth_private"."functional_sessions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."functional_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."identities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_subject" "uuid",
    "lifecycle" "rmc_auth_private"."identity_lifecycle" DEFAULT 'PENDING'::"rmc_auth_private"."identity_lifecycle" NOT NULL,
    "onboarding" "rmc_auth_private"."onboarding_state" DEFAULT 'ACTIVATION_REQUIRED'::"rmc_auth_private"."onboarding_state" NOT NULL,
    "role" "text" NOT NULL,
    "generation" bigint DEFAULT 1 NOT NULL,
    "context_version" bigint DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "active_superadmin_slot" smallint,
    CONSTRAINT "identities_active_superadmin_slot" CHECK (((("role" = 'S'::"text") AND ("lifecycle" = 'ACTIVE'::"rmc_auth_private"."identity_lifecycle") AND ("active_superadmin_slot" IS NOT NULL) AND (("active_superadmin_slot" >= 1) AND ("active_superadmin_slot" <= 2))) OR ((("role" <> 'S'::"text") OR ("lifecycle" <> 'ACTIVE'::"rmc_auth_private"."identity_lifecycle")) AND ("active_superadmin_slot" IS NULL)))),
    CONSTRAINT "identities_check" CHECK ((("lifecycle" = 'DELETED'::"rmc_auth_private"."identity_lifecycle") = ("deleted_at" IS NOT NULL))),
    CONSTRAINT "identities_context_version_check" CHECK (("context_version" > 0)),
    CONSTRAINT "identities_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "identities_id_v4" CHECK ((("id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "identities_role_check" CHECK (("role" = ANY (ARRAY['S'::"text", 'A'::"text", 'R'::"text", 'M'::"text", 'O'::"text"])))
);

ALTER TABLE ONLY "rmc_auth_private"."identities" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."identities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."identity_lookups" (
    "id" bigint NOT NULL,
    "identity_id" "uuid" NOT NULL,
    "lookup_type" "text" NOT NULL,
    "key_version" integer NOT NULL,
    "lookup_hash" "bytea" NOT NULL,
    "is_current" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "retired_at" timestamp with time zone,
    CONSTRAINT "identity_lookups_check" CHECK (("is_current" = ("retired_at" IS NULL))),
    CONSTRAINT "identity_lookups_identity_id_v4" CHECK ((("identity_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "identity_lookups_key_version_check" CHECK (("key_version" > 0)),
    CONSTRAINT "identity_lookups_lookup_type_check" CHECK (("lookup_type" = ANY (ARRAY['CPF'::"text", 'PHONE'::"text"]))),
    CONSTRAINT "lookups_sha256" CHECK (("octet_length"("lookup_hash") = 32))
);

ALTER TABLE ONLY "rmc_auth_private"."identity_lookups" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."identity_lookups" OWNER TO "postgres";


ALTER TABLE "rmc_auth_private"."identity_lookups" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "rmc_auth_private"."identity_lookups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "rmc_auth_private"."journey_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identity_id" "uuid",
    "purpose" "rmc_auth_private"."authority_purpose" NOT NULL,
    "binding_hash" "bytea" NOT NULL,
    "generation" bigint DEFAULT 1 NOT NULL,
    "state" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "consumed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "identity_generation" bigint DEFAULT 1 NOT NULL,
    "secret_hash" "bytea" NOT NULL,
    "key_version" integer NOT NULL,
    CONSTRAINT "journey_transactions_check" CHECK ((("state" = 'COMMITTED'::"text") = ("consumed_at" IS NOT NULL))),
    CONSTRAINT "journey_transactions_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "journey_transactions_id_v4" CHECK ((("id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "journey_transactions_identity_generation_check" CHECK (("identity_generation" > 0)),
    CONSTRAINT "journey_transactions_identity_id_v4" CHECK ((("identity_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "journey_transactions_state_check" CHECK (("state" = ANY (ARRAY['PENDING'::"text", 'VERIFIED'::"text", 'COMMITTED'::"text", 'EXPIRED'::"text", 'CANCELLED'::"text"]))),
    CONSTRAINT "journeys_binding_sha256" CHECK (("octet_length"("binding_hash") = 32)),
    CONSTRAINT "journeys_key_version" CHECK (("key_version" > 0)),
    CONSTRAINT "journeys_secret_sha256" CHECK (("octet_length"("secret_hash") = 32)),
    CONSTRAINT "journeys_valid_times" CHECK (("expires_at" > "created_at"))
);

ALTER TABLE ONLY "rmc_auth_private"."journey_transactions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."journey_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."rate_limit_buckets" (
    "bucket_hash" "bytea" NOT NULL,
    "purpose" "text" NOT NULL,
    "window_started_at" timestamp with time zone NOT NULL,
    "window_seconds" integer NOT NULL,
    "consumed" integer DEFAULT 0 NOT NULL,
    "limit_value" integer NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    CONSTRAINT "limiter_hash_sha256" CHECK (("octet_length"("bucket_hash") = 32)),
    CONSTRAINT "limiter_purpose_bounded" CHECK (("purpose" ~ '^[A-Z][A-Z0-9_]{0,63}$'::"text")),
    CONSTRAINT "limiter_valid_times" CHECK (("expires_at" > "window_started_at")),
    CONSTRAINT "rate_limit_buckets_check" CHECK (("consumed" <= "limit_value")),
    CONSTRAINT "rate_limit_buckets_consumed_check" CHECK (("consumed" >= 0)),
    CONSTRAINT "rate_limit_buckets_limit_value_check" CHECK (("limit_value" > 0)),
    CONSTRAINT "rate_limit_buckets_window_seconds_check" CHECK (("window_seconds" > 0))
);

ALTER TABLE ONLY "rmc_auth_private"."rate_limit_buckets" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."rate_limit_buckets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."reconciliation_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "command_id" "uuid",
    "dependency" "text" NOT NULL,
    "state" "rmc_auth_private"."reconciliation_state" DEFAULT 'PENDING'::"rmc_auth_private"."reconciliation_state" NOT NULL,
    "generation" bigint DEFAULT 1 NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer NOT NULL,
    "next_attempt_at" timestamp with time zone NOT NULL,
    "lease_owner" "uuid",
    "lease_expires_at" timestamp with time zone,
    "last_reason_code" "text",
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "reconciliation_jobs_attempt_count_check" CHECK (("attempt_count" >= 0)),
    CONSTRAINT "reconciliation_jobs_check" CHECK ((("lease_owner" IS NULL) = ("lease_expires_at" IS NULL))),
    CONSTRAINT "reconciliation_jobs_check1" CHECK (("attempt_count" <= "max_attempts")),
    CONSTRAINT "reconciliation_jobs_command_id_v4" CHECK ((("command_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "reconciliation_jobs_dependency_check" CHECK (("dependency" <> ''::"text")),
    CONSTRAINT "reconciliation_jobs_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "reconciliation_jobs_id_v4" CHECK ((("id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "reconciliation_jobs_lease_owner_v4" CHECK ((("lease_owner")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "reconciliation_jobs_max_attempts_check" CHECK (("max_attempts" > 0))
);

ALTER TABLE ONLY "rmc_auth_private"."reconciliation_jobs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."reconciliation_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."refresh_leases" (
    "session_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "generation" bigint NOT NULL,
    "fencing_token" bigint NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "acquired_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "leases_valid_times" CHECK (("expires_at" > "acquired_at")),
    CONSTRAINT "refresh_leases_fencing_token_check" CHECK (("fencing_token" > 0)),
    CONSTRAINT "refresh_leases_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "refresh_leases_owner_id_v4" CHECK ((("owner_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "refresh_leases_session_id_v4" CHECK ((("session_id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text"))
);

ALTER TABLE ONLY "rmc_auth_private"."refresh_leases" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."refresh_leases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."units_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_system" "text" NOT NULL,
    "external_unit_key" "text" NOT NULL,
    "generation" bigint DEFAULT 1 NOT NULL,
    "observed_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "source_is_active" boolean DEFAULT false NOT NULL,
    "local_is_enabled" boolean DEFAULT false NOT NULL,
    "is_eligible" boolean GENERATED ALWAYS AS (("source_is_active" AND "local_is_enabled")) STORED,
    CONSTRAINT "units_state_external_unit_key_check" CHECK ((("external_unit_key" <> ''::"text") AND ("external_unit_key" = "btrim"("external_unit_key")))),
    CONSTRAINT "units_state_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "units_state_id_v4" CHECK ((("id")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "units_state_source_system_check" CHECK ((("source_system" <> ''::"text") AND ("source_system" = "btrim"("source_system"))))
);

ALTER TABLE ONLY "rmc_auth_private"."units_state" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."units_state" OWNER TO "postgres";


ALTER TABLE ONLY "rmc_auth_private"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."audit_events"
    ADD CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."audit_outbox"
    ADD CONSTRAINT "audit_outbox_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "rmc_auth_private"."challenges"
    ADD CONSTRAINT "challenges_delivery_binding_unique" UNIQUE ("id", "purpose", "binding_hash", "generation");



ALTER TABLE ONLY "rmc_auth_private"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."command_ledger"
    ADD CONSTRAINT "command_ledger_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "rmc_auth_private"."command_ledger"
    ADD CONSTRAINT "command_ledger_pkey" PRIMARY KEY ("command_id");



ALTER TABLE ONLY "rmc_auth_private"."delivery_attempts"
    ADD CONSTRAINT "delivery_attempts_outbox_id_attempt_number_key" UNIQUE ("outbox_id", "attempt_number");



ALTER TABLE ONLY "rmc_auth_private"."delivery_attempts"
    ADD CONSTRAINT "delivery_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."delivery_outbox"
    ADD CONSTRAINT "delivery_outbox_idempotency_key_generation_key" UNIQUE ("idempotency_key", "generation");



ALTER TABLE ONLY "rmc_auth_private"."delivery_outbox"
    ADD CONSTRAINT "delivery_outbox_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."functional_sessions"
    ADD CONSTRAINT "functional_sessions_cookie_hash_key" UNIQUE ("cookie_hash");



ALTER TABLE ONLY "rmc_auth_private"."functional_sessions"
    ADD CONSTRAINT "functional_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."identities"
    ADD CONSTRAINT "identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."identities"
    ADD CONSTRAINT "identities_provider_subject_key" UNIQUE ("provider_subject");



ALTER TABLE ONLY "rmc_auth_private"."identities"
    ADD CONSTRAINT "identities_two_active_superadmins" UNIQUE ("active_superadmin_slot");



ALTER TABLE ONLY "rmc_auth_private"."identity_lookups"
    ADD CONSTRAINT "identity_lookups_identity_id_lookup_type_key_version_key" UNIQUE ("identity_id", "lookup_type", "key_version");



ALTER TABLE ONLY "rmc_auth_private"."identity_lookups"
    ADD CONSTRAINT "identity_lookups_lookup_type_key_version_lookup_hash_key" UNIQUE ("lookup_type", "key_version", "lookup_hash");



ALTER TABLE ONLY "rmc_auth_private"."identity_lookups"
    ADD CONSTRAINT "identity_lookups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."journey_transactions"
    ADD CONSTRAINT "journey_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."journey_transactions"
    ADD CONSTRAINT "journeys_binding_unique" UNIQUE ("id", "purpose", "binding_hash");



ALTER TABLE ONLY "rmc_auth_private"."rate_limit_buckets"
    ADD CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("bucket_hash", "purpose", "window_started_at");



ALTER TABLE ONLY "rmc_auth_private"."reconciliation_jobs"
    ADD CONSTRAINT "reconciliation_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."refresh_leases"
    ADD CONSTRAINT "refresh_leases_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "rmc_auth_private"."units_state"
    ADD CONSTRAINT "units_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."units_state"
    ADD CONSTRAINT "units_state_source_system_external_unit_key_key" UNIQUE ("source_system", "external_unit_key");



CREATE INDEX "assignments_creation_command_idx" ON "rmc_auth_private"."assignments" USING "btree" ("created_by_command_id");



CREATE INDEX "assignments_end_command_idx" ON "rmc_auth_private"."assignments" USING "btree" ("ended_by_command_id") WHERE ("ended_by_command_id" IS NOT NULL);



CREATE UNIQUE INDEX "assignments_one_current_manager_per_unit_idx" ON "rmc_auth_private"."assignments" USING "btree" ("unit_id") WHERE (("valid_until" IS NULL) AND ("role" = 'M'::"rmc_auth_private"."assignment_role"));



CREATE UNIQUE INDEX "assignments_one_current_per_identity_idx" ON "rmc_auth_private"."assignments" USING "btree" ("identity_id") WHERE ("valid_until" IS NULL);



CREATE INDEX "assignments_unit_id_idx" ON "rmc_auth_private"."assignments" USING "btree" ("unit_id");



CREATE INDEX "audit_command_idx" ON "rmc_auth_private"."audit_events" USING "btree" ("command_id") WHERE ("command_id" IS NOT NULL);



CREATE INDEX "audit_dispatch_idx" ON "rmc_auth_private"."audit_outbox" USING "btree" ("state", "next_attempt_at") WHERE ("state" = ANY (ARRAY['PENDING'::"rmc_auth_private"."delivery_state", 'FAILED'::"rmc_auth_private"."delivery_state"]));



CREATE INDEX "audit_identity_time_idx" ON "rmc_auth_private"."audit_events" USING "btree" ("identity_id", "occurred_at" DESC);



CREATE INDEX "challenges_expiry_idx" ON "rmc_auth_private"."challenges" USING "btree" ("expires_at") WHERE ("consumed_at" IS NULL);



CREATE INDEX "challenges_identity_generation_idx" ON "rmc_auth_private"."challenges" USING "btree" ("identity_id", "generation");



CREATE INDEX "challenges_journey_id_idx" ON "rmc_auth_private"."challenges" USING "btree" ("journey_id");



CREATE INDEX "command_actor_idx" ON "rmc_auth_private"."command_ledger" USING "btree" ("actor_identity_id");



CREATE INDEX "command_reconciliation_idx" ON "rmc_auth_private"."command_ledger" USING "btree" ("reconcile_after") WHERE ("state" = 'RECONCILIATION_REQUIRED'::"rmc_auth_private"."command_state");



CREATE INDEX "command_target_idx" ON "rmc_auth_private"."command_ledger" USING "btree" ("target_identity_id");



CREATE INDEX "delivery_dispatch_idx" ON "rmc_auth_private"."delivery_outbox" USING "btree" ("state", "next_attempt_at") WHERE ("state" = ANY (ARRAY['PENDING'::"rmc_auth_private"."delivery_state", 'FAILED'::"rmc_auth_private"."delivery_state"]));



CREATE INDEX "delivery_identity_generation_idx" ON "rmc_auth_private"."delivery_outbox" USING "btree" ("identity_id", "generation");



CREATE INDEX "delivery_lease_idx" ON "rmc_auth_private"."delivery_outbox" USING "btree" ("lease_expires_at") WHERE ("lease_owner" IS NOT NULL);



CREATE UNIQUE INDEX "delivery_one_per_challenge_idx" ON "rmc_auth_private"."delivery_outbox" USING "btree" ("challenge_id");



CREATE UNIQUE INDEX "identity_lookups_one_current_kind_idx" ON "rmc_auth_private"."identity_lookups" USING "btree" ("identity_id", "lookup_type") WHERE "is_current";



CREATE INDEX "journeys_binding_idx" ON "rmc_auth_private"."journey_transactions" USING "btree" ("binding_hash");



CREATE INDEX "journeys_expiry_idx" ON "rmc_auth_private"."journey_transactions" USING "btree" ("expires_at") WHERE ("consumed_at" IS NULL);



CREATE INDEX "journeys_identity_purpose_idx" ON "rmc_auth_private"."journey_transactions" USING "btree" ("identity_id", "purpose", "generation");



CREATE UNIQUE INDEX "journeys_secret_hash_idx" ON "rmc_auth_private"."journey_transactions" USING "btree" ("secret_hash");



CREATE INDEX "limiter_expiry_idx" ON "rmc_auth_private"."rate_limit_buckets" USING "btree" ("expires_at");



CREATE INDEX "reconciliation_command_idx" ON "rmc_auth_private"."reconciliation_jobs" USING "btree" ("command_id");



CREATE INDEX "reconciliation_dispatch_idx" ON "rmc_auth_private"."reconciliation_jobs" USING "btree" ("state", "next_attempt_at") WHERE ("state" = ANY (ARRAY['PENDING'::"rmc_auth_private"."reconciliation_state", 'CLAIMED'::"rmc_auth_private"."reconciliation_state"]));



CREATE INDEX "sessions_expiry_idx" ON "rmc_auth_private"."functional_sessions" USING "btree" ("expires_at") WHERE ("revoked_at" IS NULL);



CREATE INDEX "sessions_identity_generation_idx" ON "rmc_auth_private"."functional_sessions" USING "btree" ("identity_id", "generation");



CREATE UNIQUE INDEX "sessions_one_current_normal_per_identity_idx" ON "rmc_auth_private"."functional_sessions" USING "btree" ("identity_id") WHERE (("purpose" = 'NORMAL'::"rmc_auth_private"."authority_purpose") AND ("revoked_at" IS NULL));



CREATE OR REPLACE TRIGGER "assignments_history_guard" BEFORE INSERT OR UPDATE ON "rmc_auth_private"."assignments" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_assignment_history"();



CREATE OR REPLACE TRIGGER "challenges_authority_guard" BEFORE UPDATE ON "rmc_auth_private"."challenges" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_persisted_authority"();



CREATE OR REPLACE TRIGGER "challenges_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."challenges" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "challenges_identity_binding" BEFORE INSERT OR UPDATE ON "rmc_auth_private"."challenges" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_identity_binding"();



CREATE OR REPLACE TRIGGER "commands_authority_guard" BEFORE UPDATE ON "rmc_auth_private"."command_ledger" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_persisted_authority"();



CREATE OR REPLACE TRIGGER "commands_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."command_ledger" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "delivery_authority_guard" BEFORE UPDATE ON "rmc_auth_private"."delivery_outbox" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_persisted_authority"();



CREATE OR REPLACE TRIGGER "delivery_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."delivery_outbox" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "delivery_identity_binding" BEFORE INSERT OR UPDATE ON "rmc_auth_private"."delivery_outbox" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_identity_binding"();



CREATE OR REPLACE TRIGGER "identities_authority_guard" BEFORE UPDATE ON "rmc_auth_private"."identities" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_persisted_authority"();



CREATE OR REPLACE TRIGGER "identities_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."identities" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "journeys_authority_guard" BEFORE UPDATE ON "rmc_auth_private"."journey_transactions" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_persisted_authority"();



CREATE OR REPLACE TRIGGER "journeys_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."journey_transactions" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "leases_authority_guard" BEFORE UPDATE ON "rmc_auth_private"."refresh_leases" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_persisted_authority"();



CREATE OR REPLACE TRIGGER "leases_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."refresh_leases" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "lookups_authority_guard" BEFORE UPDATE ON "rmc_auth_private"."identity_lookups" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_persisted_authority"();



CREATE OR REPLACE TRIGGER "reconciliation_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."reconciliation_jobs" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "sessions_authority_guard" BEFORE UPDATE ON "rmc_auth_private"."functional_sessions" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."guard_persisted_authority"();



CREATE OR REPLACE TRIGGER "sessions_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."functional_sessions" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "units_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."units_state" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



ALTER TABLE ONLY "rmc_auth_private"."assignments"
    ADD CONSTRAINT "assignments_creation_command" FOREIGN KEY ("created_by_command_id") REFERENCES "rmc_auth_private"."command_ledger"("command_id");



ALTER TABLE ONLY "rmc_auth_private"."assignments"
    ADD CONSTRAINT "assignments_end_command" FOREIGN KEY ("ended_by_command_id") REFERENCES "rmc_auth_private"."command_ledger"("command_id");



ALTER TABLE ONLY "rmc_auth_private"."assignments"
    ADD CONSTRAINT "assignments_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."assignments"
    ADD CONSTRAINT "assignments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "rmc_auth_private"."units_state"("id");



ALTER TABLE ONLY "rmc_auth_private"."audit_events"
    ADD CONSTRAINT "audit_command" FOREIGN KEY ("command_id") REFERENCES "rmc_auth_private"."command_ledger"("command_id");



ALTER TABLE ONLY "rmc_auth_private"."audit_events"
    ADD CONSTRAINT "audit_events_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."audit_outbox"
    ADD CONSTRAINT "audit_outbox_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "rmc_auth_private"."audit_events"("id");



ALTER TABLE ONLY "rmc_auth_private"."challenges"
    ADD CONSTRAINT "challenges_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."challenges"
    ADD CONSTRAINT "challenges_journey_binding" FOREIGN KEY ("journey_id", "purpose", "binding_hash") REFERENCES "rmc_auth_private"."journey_transactions"("id", "purpose", "binding_hash");



ALTER TABLE ONLY "rmc_auth_private"."challenges"
    ADD CONSTRAINT "challenges_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "rmc_auth_private"."journey_transactions"("id");



ALTER TABLE ONLY "rmc_auth_private"."command_ledger"
    ADD CONSTRAINT "command_ledger_actor_identity_id_fkey" FOREIGN KEY ("actor_identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."command_ledger"
    ADD CONSTRAINT "command_ledger_target_identity_id_fkey" FOREIGN KEY ("target_identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."delivery_attempts"
    ADD CONSTRAINT "delivery_attempts_outbox_id_fkey" FOREIGN KEY ("outbox_id") REFERENCES "rmc_auth_private"."delivery_outbox"("id");



ALTER TABLE ONLY "rmc_auth_private"."delivery_outbox"
    ADD CONSTRAINT "delivery_challenge_binding" FOREIGN KEY ("challenge_id", "purpose", "binding_hash", "generation") REFERENCES "rmc_auth_private"."challenges"("id", "purpose", "binding_hash", "generation");



ALTER TABLE ONLY "rmc_auth_private"."delivery_outbox"
    ADD CONSTRAINT "delivery_outbox_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "rmc_auth_private"."challenges"("id");



ALTER TABLE ONLY "rmc_auth_private"."delivery_outbox"
    ADD CONSTRAINT "delivery_outbox_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."functional_sessions"
    ADD CONSTRAINT "functional_sessions_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."identity_lookups"
    ADD CONSTRAINT "identity_lookups_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."journey_transactions"
    ADD CONSTRAINT "journey_transactions_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."reconciliation_jobs"
    ADD CONSTRAINT "reconciliation_jobs_command_id_fkey" FOREIGN KEY ("command_id") REFERENCES "rmc_auth_private"."command_ledger"("command_id");



ALTER TABLE ONLY "rmc_auth_private"."refresh_leases"
    ADD CONSTRAINT "refresh_leases_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "rmc_auth_private"."functional_sessions"("id");



ALTER TABLE "rmc_auth_private"."assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."audit_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."audit_outbox" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."command_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."delivery_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."delivery_outbox" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."functional_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."identity_lookups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."journey_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."rate_limit_buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."reconciliation_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."refresh_leases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."units_state" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "rmc_auth_private" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."challenges" TO "service_role";



GRANT SELECT,INSERT ON TABLE "rmc_auth_private"."command_ledger" TO "service_role";



GRANT INSERT ON TABLE "rmc_auth_private"."delivery_outbox" TO "service_role";



GRANT SELECT ON TABLE "rmc_auth_private"."functional_sessions" TO "service_role";



GRANT UPDATE("id") ON TABLE "rmc_auth_private"."functional_sessions" TO "service_role";



GRANT SELECT ON TABLE "rmc_auth_private"."identities" TO "service_role";



GRANT UPDATE("id") ON TABLE "rmc_auth_private"."identities" TO "service_role";



GRANT SELECT ON TABLE "rmc_auth_private"."journey_transactions" TO "service_role";



GRANT UPDATE("id") ON TABLE "rmc_auth_private"."journey_transactions" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."refresh_leases" TO "service_role";
