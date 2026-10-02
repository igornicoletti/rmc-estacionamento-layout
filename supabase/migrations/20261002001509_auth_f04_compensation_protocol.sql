-- Administrative local protocol; only reads Auth-owned tables, never writes them.
create function rmc_auth_private.confirm_compensation_blocked(p_command uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare c rmc_auth_private.provisioning_compensations%rowtype;
  r rmc_auth_private.provider_reservations%rowtype; metadata jsonb;
begin
  if current_user<>'postgres' then return false; end if;
  perform command_id from rmc_auth_private.command_ledger where command_id=p_command for update;
  select * into c from rmc_auth_private.provisioning_compensations where command_id=p_command for update;
  if c.command_id is null or c.state not in ('FENCED','PROVIDER_BLOCKED') then return false; end if;
  select * into r from rmc_auth_private.provider_reservations where command_id=p_command;
  if r.provider_subject is distinct from c.provider_subject or r.ownership_binding is distinct from c.ownership_binding then return false; end if;
  select raw_app_meta_data->'rmc_provisioning' into metadata from auth.users
    where id=c.provider_subject and banned_until>clock_timestamp()+interval '1 hour';
  if metadata is distinct from jsonb_build_object('purpose','PROVISION_IDENTITY','contractVersion','1.1',
    'commandId',r.command_id,'identityId',r.identity_id,'ownershipBinding',r.ownership_binding,'identityGeneration',r.identity_generation)
    or exists(select 1 from auth.sessions where user_id=c.provider_subject)
    or not exists(select 1 from rmc_auth_private.identities where id=c.identity_id and lifecycle='DISABLED'
      and generation=c.fenced_generation and provider_subject is null) then
    -- Existing sessions/ambiguous revocation require operator escalation; no deletion permitted.
    update rmc_auth_private.provisioning_compensations set state='ESCALATED' where command_id=p_command;
    return false;
  end if;
  update rmc_auth_private.provisioning_compensations set state='PROVIDER_BLOCKED' where command_id=p_command;
  return true;
end $$;

create function rmc_auth_private.finish_provisioning_compensation(p_command uuid,p_request uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare c rmc_auth_private.provisioning_compensations%rowtype; event_id uuid;
begin
  if current_user<>'postgres' or p_request is null then return false; end if;
  perform command_id from rmc_auth_private.command_ledger where command_id=p_command for update;
  select * into c from rmc_auth_private.provisioning_compensations where command_id=p_command for update;
  if c.command_id is null then return false; end if;
  if c.state='DELETED' then return true; end if;
  if c.state<>'PROVIDER_BLOCKED' or exists(select 1 from auth.users where id=c.provider_subject)
    or exists(select 1 from auth.sessions where user_id=c.provider_subject) then return false; end if;
  update rmc_auth_private.provisioning_compensations set state='DELETED' where command_id=p_command;
  update rmc_auth_private.command_ledger set state='RECONCILIATION_REQUIRED',updated_at=clock_timestamp()
    where command_id=p_command and state='EFFECT_CONFIRMED';
  update rmc_auth_private.command_ledger set state='FAILED_CONFIRMED',result_code='PROVISION_COMPENSATED',updated_at=clock_timestamp()
    where command_id=p_command and state='RECONCILIATION_REQUIRED';
  insert into rmc_auth_private.audit_events(event_type,request_id,command_id,identity_id,generation,outcome,
    reason_code,contract_version,deployment_id) values('ADMIN_COMMAND_OUTCOME',p_request::text,p_command,
    c.identity_id,c.fenced_generation,'FAILURE','PROVISION_COMPENSATED','1.1','LOCAL') returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  return true;
end $$;
revoke execute on function rmc_auth_private.confirm_compensation_blocked(uuid),
  rmc_auth_private.finish_provisioning_compensation(uuid,uuid) from public,anon,authenticated,service_role;
