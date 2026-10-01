


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
    CONSTRAINT "assignments_check1" CHECK ((("valid_until" IS NULL) = ("ended_by_command_id" IS NULL)))
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
    CONSTRAINT "audit_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['AUTH_LOGIN_OUTCOME'::"text", 'MFA_OUTCOME'::"text", 'SESSION_REVOKED'::"text", 'SESSION_REFRESH_OUTCOME'::"text", 'CHALLENGE_REQUESTED'::"text", 'CHALLENGE_VERIFIED'::"text", 'RECOVERY_OUTCOME'::"text", 'ADMIN_COMMAND_OUTCOME'::"text", 'DELIVERY_OUTCOME'::"text", 'RECONCILIATION_REQUIRED'::"text", 'RECONCILIATION_RESOLVED'::"text"]))),
    CONSTRAINT "audit_events_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "audit_events_outcome_check" CHECK (("outcome" = ANY (ARRAY['ALLOW'::"text", 'DENY'::"text", 'SUCCESS'::"text", 'FAILURE'::"text", 'UNKNOWN'::"text"]))),
    CONSTRAINT "audit_events_reason_code_check" CHECK (("reason_code" <> ''::"text")),
    CONSTRAINT "audit_events_request_id_check" CHECK (("request_id" <> ''::"text"))
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
    CONSTRAINT "audit_outbox_check" CHECK ((("lease_owner" IS NULL) = ("lease_expires_at" IS NULL)))
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
    CONSTRAINT "challenges_check" CHECK (("attempt_count" <= "max_attempts")),
    CONSTRAINT "challenges_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "challenges_key_version_check" CHECK (("key_version" > 0)),
    CONSTRAINT "challenges_max_attempts_check" CHECK (("max_attempts" > 0))
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
    CONSTRAINT "command_ledger_command_type_check" CHECK (("command_type" <> ''::"text")),
    CONSTRAINT "command_ledger_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "command_ledger_result_payload_check" CHECK ((("result_payload" IS NULL) OR ("jsonb_typeof"("result_payload") = 'object'::"text")))
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
    CONSTRAINT "delivery_outbox_attempt_count_check" CHECK (("attempt_count" >= 0)),
    CONSTRAINT "delivery_outbox_check" CHECK ((("lease_owner" IS NULL) = ("lease_expires_at" IS NULL))),
    CONSTRAINT "delivery_outbox_check1" CHECK (("attempt_count" <= "max_attempts")),
    CONSTRAINT "delivery_outbox_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "delivery_outbox_key_version_check" CHECK (("key_version" > 0)),
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
    CONSTRAINT "functional_sessions_check" CHECK (("idle_expires_at" <= "expires_at")),
    CONSTRAINT "functional_sessions_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "functional_sessions_key_version_check" CHECK (("key_version" > 0))
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
    CONSTRAINT "identities_check" CHECK ((("lifecycle" = 'DELETED'::"rmc_auth_private"."identity_lifecycle") = ("deleted_at" IS NOT NULL))),
    CONSTRAINT "identities_context_version_check" CHECK (("context_version" > 0)),
    CONSTRAINT "identities_generation_check" CHECK (("generation" > 0)),
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
    CONSTRAINT "identity_lookups_key_version_check" CHECK (("key_version" > 0)),
    CONSTRAINT "identity_lookups_lookup_type_check" CHECK (("lookup_type" = ANY (ARRAY['CPF'::"text", 'PHONE'::"text"])))
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
    CONSTRAINT "journey_transactions_check" CHECK ((("state" = 'COMMITTED'::"text") = ("consumed_at" IS NOT NULL))),
    CONSTRAINT "journey_transactions_generation_check" CHECK (("generation" > 0)),
    CONSTRAINT "journey_transactions_state_check" CHECK (("state" = ANY (ARRAY['PENDING'::"text", 'VERIFIED'::"text", 'COMMITTED'::"text", 'EXPIRED'::"text", 'CANCELLED'::"text"])))
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
    CONSTRAINT "reconciliation_jobs_dependency_check" CHECK (("dependency" <> ''::"text")),
    CONSTRAINT "reconciliation_jobs_generation_check" CHECK (("generation" > 0)),
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
    CONSTRAINT "refresh_leases_fencing_token_check" CHECK (("fencing_token" > 0)),
    CONSTRAINT "refresh_leases_generation_check" CHECK (("generation" > 0))
);

ALTER TABLE ONLY "rmc_auth_private"."refresh_leases" FORCE ROW LEVEL SECURITY;


ALTER TABLE "rmc_auth_private"."refresh_leases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rmc_auth_private"."units_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_system" "text" NOT NULL,
    "external_unit_key" "text" NOT NULL,
    "is_eligible" boolean DEFAULT false NOT NULL,
    "generation" bigint DEFAULT 1 NOT NULL,
    "observed_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "units_state_external_unit_key_check" CHECK ((("external_unit_key" <> ''::"text") AND ("external_unit_key" = "btrim"("external_unit_key")))),
    CONSTRAINT "units_state_generation_check" CHECK (("generation" > 0)),
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



ALTER TABLE ONLY "rmc_auth_private"."identity_lookups"
    ADD CONSTRAINT "identity_lookups_identity_id_lookup_type_key_version_key" UNIQUE ("identity_id", "lookup_type", "key_version");



ALTER TABLE ONLY "rmc_auth_private"."identity_lookups"
    ADD CONSTRAINT "identity_lookups_lookup_type_key_version_lookup_hash_key" UNIQUE ("lookup_type", "key_version", "lookup_hash");



ALTER TABLE ONLY "rmc_auth_private"."identity_lookups"
    ADD CONSTRAINT "identity_lookups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rmc_auth_private"."journey_transactions"
    ADD CONSTRAINT "journey_transactions_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "identity_lookups_hash_idx" ON "rmc_auth_private"."identity_lookups" USING "btree" ("lookup_type", "key_version", "lookup_hash");



CREATE UNIQUE INDEX "identity_lookups_one_current_kind_idx" ON "rmc_auth_private"."identity_lookups" USING "btree" ("identity_id", "lookup_type") WHERE "is_current";



CREATE INDEX "journeys_expiry_idx" ON "rmc_auth_private"."journey_transactions" USING "btree" ("expires_at") WHERE ("consumed_at" IS NULL);



CREATE INDEX "journeys_identity_purpose_idx" ON "rmc_auth_private"."journey_transactions" USING "btree" ("identity_id", "purpose", "generation");



CREATE INDEX "limiter_expiry_idx" ON "rmc_auth_private"."rate_limit_buckets" USING "btree" ("expires_at");



CREATE INDEX "reconciliation_command_idx" ON "rmc_auth_private"."reconciliation_jobs" USING "btree" ("command_id");



CREATE INDEX "reconciliation_dispatch_idx" ON "rmc_auth_private"."reconciliation_jobs" USING "btree" ("state", "next_attempt_at") WHERE ("state" = ANY (ARRAY['PENDING'::"rmc_auth_private"."reconciliation_state", 'CLAIMED'::"rmc_auth_private"."reconciliation_state"]));



CREATE INDEX "sessions_expiry_idx" ON "rmc_auth_private"."functional_sessions" USING "btree" ("expires_at") WHERE ("revoked_at" IS NULL);



CREATE INDEX "sessions_identity_generation_idx" ON "rmc_auth_private"."functional_sessions" USING "btree" ("identity_id", "generation");



CREATE UNIQUE INDEX "sessions_one_current_normal_per_identity_idx" ON "rmc_auth_private"."functional_sessions" USING "btree" ("identity_id") WHERE (("purpose" = 'NORMAL'::"rmc_auth_private"."authority_purpose") AND ("revoked_at" IS NULL));



CREATE OR REPLACE TRIGGER "challenges_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."challenges" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "commands_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."command_ledger" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "delivery_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."delivery_outbox" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "identities_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."identities" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "journeys_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."journey_transactions" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "leases_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."refresh_leases" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "reconciliation_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."reconciliation_jobs" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "sessions_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."functional_sessions" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



CREATE OR REPLACE TRIGGER "units_generation_monotonic" BEFORE UPDATE OF "generation" ON "rmc_auth_private"."units_state" FOR EACH ROW EXECUTE FUNCTION "rmc_auth_private"."reject_generation_regression"();



ALTER TABLE ONLY "rmc_auth_private"."assignments"
    ADD CONSTRAINT "assignments_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."assignments"
    ADD CONSTRAINT "assignments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "rmc_auth_private"."units_state"("id");



ALTER TABLE ONLY "rmc_auth_private"."audit_events"
    ADD CONSTRAINT "audit_events_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."audit_outbox"
    ADD CONSTRAINT "audit_outbox_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "rmc_auth_private"."audit_events"("id");



ALTER TABLE ONLY "rmc_auth_private"."challenges"
    ADD CONSTRAINT "challenges_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."challenges"
    ADD CONSTRAINT "challenges_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "rmc_auth_private"."journey_transactions"("id");



ALTER TABLE ONLY "rmc_auth_private"."command_ledger"
    ADD CONSTRAINT "command_ledger_actor_identity_id_fkey" FOREIGN KEY ("actor_identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."command_ledger"
    ADD CONSTRAINT "command_ledger_target_identity_id_fkey" FOREIGN KEY ("target_identity_id") REFERENCES "rmc_auth_private"."identities"("id");



ALTER TABLE ONLY "rmc_auth_private"."delivery_attempts"
    ADD CONSTRAINT "delivery_attempts_outbox_id_fkey" FOREIGN KEY ("outbox_id") REFERENCES "rmc_auth_private"."delivery_outbox"("id");



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



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."assignments" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."audit_events" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."audit_outbox" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."challenges" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."command_ledger" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."delivery_attempts" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "rmc_auth_private"."delivery_attempts_id_seq" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."delivery_outbox" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."functional_sessions" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."identities" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."identity_lookups" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "rmc_auth_private"."identity_lookups_id_seq" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."journey_transactions" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."rate_limit_buckets" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."reconciliation_jobs" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."refresh_leases" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "rmc_auth_private"."units_state" TO "service_role";
