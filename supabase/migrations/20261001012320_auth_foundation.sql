create extension if not exists pgcrypto with schema extensions;
create extension if not exists pgtap with schema extensions;

create schema rmc_auth_private authorization postgres;
create schema rmc_auth_api authorization postgres;

revoke all on schema rmc_auth_private from public, anon, authenticated;
revoke all on schema rmc_auth_api from public, anon, authenticated;

alter default privileges for role postgres in schema rmc_auth_private
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema rmc_auth_private
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema rmc_auth_private
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema rmc_auth_api
  revoke execute on functions from public, anon, authenticated;

create type rmc_auth_private.identity_lifecycle as enum
  ('PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'DISABLED', 'DELETED');
create type rmc_auth_private.onboarding_state as enum
  ('ACTIVATION_REQUIRED', 'PASSWORD_REQUIRED', 'SECURITY_SETUP', 'COMPLETE');
create type rmc_auth_private.authority_purpose as enum
  ('PREAUTH', 'MFA_PENDING', 'BOOTSTRAP', 'RECOVERY', 'NORMAL');
create type rmc_auth_private.assurance_level as enum ('aal1', 'aal2');
create type rmc_auth_private.assignment_role as enum ('M', 'O');
create type rmc_auth_private.command_state as enum
  ('CLAIMED', 'EFFECT_REQUESTED', 'EFFECT_CONFIRMED', 'COMMITTED', 'FAILED_CONFIRMED', 'RECONCILIATION_REQUIRED');
create type rmc_auth_private.delivery_state as enum
  ('PENDING', 'CLAIMED', 'PUBLISHED', 'DELIVERED', 'FAILED', 'DEAD_LETTER');
create type rmc_auth_private.reconciliation_state as enum
  ('PENDING', 'CLAIMED', 'RESOLVED', 'ESCALATED');
