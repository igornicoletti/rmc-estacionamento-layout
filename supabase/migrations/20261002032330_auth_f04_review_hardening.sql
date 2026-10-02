-- Preserve migration history. Unchecked primitives are no longer Data API RPCs.
alter function rmc_auth_api.admit_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean) set schema rmc_auth_private;
alter function rmc_auth_api.commit_provider_reservation(uuid,uuid,bigint,uuid,text) set schema rmc_auth_private;
-- Rewrite only the two trusted, existing wrapper bodies; no caller SQL/input.
do $$ begin
  execute replace(pg_get_functiondef('rmc_auth_api.admit_authorized_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean)'::regprocedure),
    'rmc_auth_api.admit_provider_attempt(', 'rmc_auth_private.admit_provider_attempt(');
  execute replace(pg_get_functiondef('rmc_auth_api.commit_authorized_provider_reservation(uuid,uuid,bigint,uuid,text)'::regprocedure),
    'rmc_auth_api.commit_provider_reservation(', 'rmc_auth_private.commit_provider_reservation(');
end $$;
-- Legacy names are compatible, but never bypass current authorization.
create function rmc_auth_api.admit_provider_attempt(p_command uuid,p_owner uuid,p_fence bigint,
  p_provider uuid,p_binding uuid,p_generation bigint,p_mutation boolean)
returns boolean language sql security invoker set search_path='' as $$
  select rmc_auth_api.admit_authorized_provider_attempt(p_command,p_owner,p_fence,p_provider,p_binding,p_generation,p_mutation)
$$;
create function rmc_auth_api.commit_provider_reservation(p_command uuid,p_owner uuid,p_fence bigint,p_request uuid,p_deployment text)
returns boolean language sql security invoker set search_path='' as $$
  select rmc_auth_api.commit_authorized_provider_reservation(p_command,p_owner,p_fence,p_request,p_deployment)
$$;
revoke execute on function rmc_auth_api.admit_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean),
  rmc_auth_api.commit_provider_reservation(uuid,uuid,bigint,uuid,text) from public,anon,authenticated;
grant execute on function rmc_auth_api.admit_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean),
  rmc_auth_api.commit_provider_reservation(uuid,uuid,bigint,uuid,text) to service_role;

create or replace function rmc_auth_api.settle_provisioning_batch(p_owner uuid,p_fence bigint,p_healthy boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
declare runtime rmc_auth_private.provisioning_reconciler%rowtype; v_failures integer;
begin
  select * into runtime from rmc_auth_private.provisioning_reconciler where singleton for update;
  if runtime.owner is distinct from p_owner or runtime.fence is distinct from p_fence
    or runtime.owner is null or runtime.lease_until<=clock_timestamp() then return false; end if;
  -- NULL means no dependency work: release lease, preserving circuit history.
  v_failures:=case when p_healthy is null then runtime.failures when p_healthy then 0 else least(3,runtime.failures+1) end;
  update rmc_auth_private.provisioning_reconciler set owner=null,lease_until=null,failures=v_failures,
    open_until=case when p_healthy is null then runtime.open_until
      when v_failures=3 then clock_timestamp()+interval '60 seconds' else null end where singleton;
  return true;
end $$;

create function rmc_auth_api.record_provisioning_conflict(p_command uuid,p_owner uuid,p_fence bigint,
  p_provider uuid,p_binding uuid,p_request uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare cmd rmc_auth_private.command_ledger%rowtype; r rmc_auth_private.provider_reservations%rowtype;
  inserted uuid; event_id uuid;
begin
  select * into cmd from rmc_auth_private.command_ledger where command_id=p_command for update;
  select * into r from rmc_auth_private.provider_reservations where command_id=p_command for update;
  if p_request is null or cmd.command_type is distinct from 'PROVISION_IDENTITY'
    or cmd.state not in ('EFFECT_REQUESTED','RECONCILIATION_REQUIRED','EFFECT_CONFIRMED')
    or r.command_id is null or cmd.target_identity_id is distinct from r.identity_id
    or r.lease_owner is distinct from p_owner or r.fence is distinct from p_fence
    or r.provider_subject is distinct from p_provider or r.ownership_binding is distinct from p_binding
    or r.lease_expires_at<=clock_timestamp() or r.state not in ('RESERVED','UNKNOWN','CONFIRMED') then return false; end if;
  insert into rmc_auth_private.provisioning_escalations(command_id,reason)
    values(p_command,'OWNERSHIP_CONFLICT') on conflict(command_id) do nothing returning command_id into inserted;
  if inserted is null then
    return exists(select 1 from rmc_auth_private.provisioning_escalations where command_id=p_command and reason='OWNERSHIP_CONFLICT');
  end if;
  insert into rmc_auth_private.audit_events(event_type,request_id,command_id,identity_id,generation,outcome,
    reason_code,contract_version,deployment_id) values('ADMIN_COMMAND_OUTCOME',p_request::text,p_command,
    r.identity_id,r.identity_generation,'FAILURE','OWNERSHIP_CONFLICT','1.1','LOCAL') returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  return true;
end $$;
revoke execute on function rmc_auth_api.record_provisioning_conflict(uuid,uuid,bigint,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function rmc_auth_api.record_provisioning_conflict(uuid,uuid,bigint,uuid,uuid,uuid) to service_role;
