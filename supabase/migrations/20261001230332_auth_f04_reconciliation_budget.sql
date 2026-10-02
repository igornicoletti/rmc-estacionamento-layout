-- Technical local policy: eight lookup-only claims, 24h deadline, capped backoff.
-- Exhaustion preserves the unresolved command; it never proves external absence.
alter table rmc_auth_private.provider_reservations
  add column reconcile_attempts integer not null default 0 check(reconcile_attempts between 0 and 8),
  add column next_reconcile_at timestamptz not null default clock_timestamp(),
  add column reconcile_deadline timestamptz not null default (clock_timestamp()+interval '24 hours');

create function rmc_auth_private.guard_provider_budget()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.reconcile_attempts<old.reconcile_attempts or new.reconcile_attempts>old.reconcile_attempts+1
    or new.next_reconcile_at<old.next_reconcile_at
    or new.reconcile_deadline is distinct from old.reconcile_deadline then
    raise exception using errcode='23514',message='AUTH_RECONCILE_BUDGET_IMMUTABLE';
  end if;
  return new;
end $$;
create trigger provider_budget_guard before update on rmc_auth_private.provider_reservations
  for each row execute function rmc_auth_private.guard_provider_budget();

create or replace function rmc_auth_api.claim_provider_reconciliation(p_command uuid,p_owner uuid)
returns rmc_auth_private.provider_reservations language plpgsql security invoker set search_path='' as $$
declare
  reservation rmc_auth_private.provider_reservations%rowtype;
  cmd rmc_auth_private.command_ledger%rowtype;
begin
  if p_owner is null then raise exception using errcode='22023',message='AUTH_PROVISION_BINDING_INVALID'; end if;
  -- Align with admission/outcome/commit. No DB transaction spans provider I/O.
  select * into cmd from rmc_auth_private.command_ledger where command_id=p_command for update;
  if cmd.command_id is null or cmd.command_type<>'PROVISION_IDENTITY'
    or cmd.state not in ('EFFECT_REQUESTED','RECONCILIATION_REQUIRED','EFFECT_CONFIRMED') then return null; end if;
  update rmc_auth_private.provider_reservations set fence=fence+1,lease_owner=p_owner,
    lease_expires_at=clock_timestamp()+interval '30 seconds',
    reconcile_attempts=reconcile_attempts+1,
    next_reconcile_at=clock_timestamp()+make_interval(secs=>least(3600,60*power(2,reconcile_attempts))::integer)
    where command_id=p_command and identity_id=cmd.target_identity_id and lease_expires_at<=clock_timestamp()
      and next_reconcile_at<=clock_timestamp() and reconcile_deadline>clock_timestamp()
      and reconcile_attempts<8 and state in ('RESERVED','UNKNOWN','CONFIRMED')
    returning * into reservation;
  return reservation;
end $$;
create index provider_reconciliation_due on rmc_auth_private.provider_reservations(next_reconcile_at,reconcile_deadline)
  where state in ('RESERVED','UNKNOWN','CONFIRMED') and reconcile_attempts<8;
revoke execute on function rmc_auth_private.guard_provider_budget() from public,anon,authenticated;
revoke execute on function rmc_auth_api.claim_provider_reconciliation(uuid,uuid) from public,anon,authenticated;
grant execute on function rmc_auth_private.guard_provider_budget(),
  rmc_auth_api.claim_provider_reconciliation(uuid,uuid) to service_role;
grant update(reconcile_attempts,next_reconcile_at) on rmc_auth_private.provider_reservations to service_role;
