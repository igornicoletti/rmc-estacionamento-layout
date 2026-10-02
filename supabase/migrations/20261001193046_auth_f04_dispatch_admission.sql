-- At most one dispatch permission per command, not a claim of exactly-once delivery.
alter table rmc_auth_private.provider_reservations
  add column dispatch_claimed boolean not null default false;
create function rmc_auth_private.guard_provider_dispatch()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if old.dispatch_claimed and not new.dispatch_claimed then
    raise exception using errcode='23514',message='AUTH_DISPATCH_IMMUTABLE';
  end if;
  return new;
end $$;
create trigger provider_dispatch_guard before update on rmc_auth_private.provider_reservations
  for each row execute function rmc_auth_private.guard_provider_dispatch();

create function rmc_auth_api.admit_provider_attempt(p_command uuid,p_owner uuid,p_fence bigint,
  p_provider uuid,p_binding uuid,p_generation bigint,p_mutation boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
declare
  cmd rmc_auth_private.command_ledger%rowtype;
  reservation rmc_auth_private.provider_reservations%rowtype;
  ident rmc_auth_private.identities%rowtype;
begin
  -- Same ordering as final commit: command -> reservation -> ordered identities.
  select * into cmd from rmc_auth_private.command_ledger where command_id=p_command for update;
  select * into reservation from rmc_auth_private.provider_reservations where command_id=p_command for update;
  if cmd.command_id is null or cmd.command_type<>'PROVISION_IDENTITY'
    or cmd.state not in ('EFFECT_REQUESTED','RECONCILIATION_REQUIRED','EFFECT_CONFIRMED')
    or cmd.target_identity_id is distinct from reservation.identity_id
    or reservation.command_id is null or reservation.lease_owner is distinct from p_owner
    or reservation.fence is distinct from p_fence or reservation.provider_subject is distinct from p_provider
    or reservation.ownership_binding is distinct from p_binding or reservation.identity_generation is distinct from p_generation
    or reservation.lease_expires_at<=clock_timestamp() or p_mutation is null
    or reservation.state not in ('RESERVED','UNKNOWN','CONFIRMED') then return false; end if;
  perform id from rmc_auth_private.identities where id in (cmd.actor_identity_id,reservation.identity_id) order by id for share;
  if cmd.actor_identity_id is not null and not exists(select 1 from rmc_auth_private.identities
    where id=cmd.actor_identity_id and lifecycle='ACTIVE') then return false; end if;
  select * into ident from rmc_auth_private.identities where id=reservation.identity_id;
  if ident.id is null or ident.lifecycle is distinct from 'PENDING'::rmc_auth_private.identity_lifecycle or ident.generation is distinct from p_generation
    or ident.provider_subject is not null then return false; end if;
  if p_mutation then
    if reservation.state<>'RESERVED' or reservation.dispatch_claimed then return false; end if;
    update rmc_auth_private.provider_reservations set dispatch_claimed=true where command_id=p_command;
  end if;
  -- This is reservation/lifecycle admission, never full capability/scope/assurance authorization.
  -- No public provisioning endpoint in F04; composition remains local/controlled only.
  return true;
end $$;
revoke execute on function rmc_auth_api.admit_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean)
  from public,anon,authenticated;
revoke execute on function rmc_auth_private.guard_provider_dispatch() from public,anon,authenticated;
grant execute on function rmc_auth_api.admit_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean),
  rmc_auth_private.guard_provider_dispatch() to service_role;
grant update(dispatch_claimed) on rmc_auth_private.provider_reservations to service_role;
