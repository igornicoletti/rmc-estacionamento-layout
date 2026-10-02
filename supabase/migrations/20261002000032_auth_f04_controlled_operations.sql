-- Controlled local operations. No public bootstrap endpoint or provider SQL writes.
alter table rmc_auth_private.audit_events drop constraint audit_reason_allowlist;
alter table rmc_auth_private.audit_events add constraint audit_reason_allowlist check (reason_code in (
  'VERIFIED','REVOKED','COMMITTED','ACCEPTED','DELIVERED','EXPIRED','STALE','RECONCILIATION_REQUIRED',
  'AUTH_INVALID_REQUEST','AUTH_SESSION_INVALID','AUTH_CREDENTIALS_INVALID','AUTH_ORIGIN_DENIED',
  'AUTH_CSRF_INVALID','AUTH_ACCESS_DENIED','AUTH_STEP_UP_REQUIRED','RESOURCE_NOT_FOUND',
  'AUTH_STATE_CONFLICT','AUTH_BODY_TOO_LARGE','AUTH_UNSUPPORTED_MEDIA_TYPE','AUTH_RATE_LIMITED',
  'AUTH_CONFIGURATION_ERROR','AUTH_UNEXPECTED_ERROR','AUTH_PROVIDER_FAILURE',
  'AUTH_DEPENDENCY_UNAVAILABLE','AUTH_DEPENDENCY_TIMEOUT','PROVISION_RESERVED','PROVISION_COMMITTED',
  'PROVIDER_OUTCOME_UNKNOWN','OWNERSHIP_CONFLICT','STALE_FENCE','RECONCILIATION_CONFIRMED',
  'DAY_ZERO_COMPLETE','PROVISION_COMPENSATION_FENCED','PROVISION_COMPENSATED'));
create table rmc_auth_private.provisioning_phone_sources (
  identity_id uuid primary key references rmc_auth_private.identities(id),
  identity_generation bigint not null check(identity_generation>0),
  codec_version integer not null default 1 check(codec_version=1),
  algorithm text not null default 'A256GCM' check(algorithm='A256GCM'),
  purpose text not null default 'PHONE' check(purpose='PHONE'),
  key_version integer not null check(key_version>0),
  ciphertext bytea not null check(octet_length(ciphertext) between 31 and 44),
  created_at timestamptz not null default clock_timestamp()
);
alter table rmc_auth_private.provisioning_phone_sources enable row level security;
alter table rmc_auth_private.provisioning_phone_sources force row level security;

create table rmc_auth_private.day_zero_receipt (
  singleton boolean primary key default true check(singleton),
  command_id uuid not null unique references rmc_auth_private.command_ledger(command_id),
  operator_id uuid not null,
  state text not null default 'RESERVED' check(state in ('RESERVED','COMPLETE','CLOSED')),
  created_at timestamptz not null default clock_timestamp(),
  closed_at timestamptz,
  check((state='RESERVED')=(closed_at is null))
);
alter table rmc_auth_private.day_zero_receipt enable row level security;
alter table rmc_auth_private.day_zero_receipt force row level security;

-- Explicit operator-only invocation; no EXECUTE/INSERT grants to BFF or browser roles.
create function rmc_auth_private.begin_day_zero(p_identity uuid,p_command uuid,p_key uuid,p_intent bytea,
  p_operator uuid,p_cpf_key integer,p_cpf_cipher bytea,p_lookup_versions integer[],p_cpf_hashes bytea[],
  p_phone_key integer,p_phone_cipher bytea,p_phone_hash bytea)
returns uuid language plpgsql security invoker set search_path='' as $$
declare receipt rmc_auth_private.day_zero_receipt%rowtype;
  cmd rmc_auth_private.command_ledger%rowtype; policy_generation bigint;
begin
  if current_user<>'postgres' or p_identity is null or p_command is null or p_key is null or p_operator is null
    or octet_length(p_intent) is distinct from 32 or p_phone_key is null or p_phone_key<1
    or octet_length(p_phone_cipher) not between 31 and 44 or p_phone_cipher is null
    or octet_length(p_phone_hash) is distinct from 32 then
    raise exception using errcode='22023',message='AUTH_DAY_ZERO_INVALID';
  end if;
  -- Serializes first-S creation with concurrent day-zero calls, not a network lease.
  perform pg_advisory_xact_lock(73041001);
  select * into receipt from rmc_auth_private.day_zero_receipt where singleton for update;
  if found then
    select * into cmd from rmc_auth_private.command_ledger where command_id=receipt.command_id;
    if receipt.command_id<>p_command or receipt.operator_id<>p_operator
      or cmd.target_identity_id<>p_identity or cmd.idempotency_key<>p_key or cmd.intent_hash<>p_intent then
      raise exception using errcode='23505',message='AUTH_DAY_ZERO_CONFLICT';
    end if;
    -- Exact reexecution retrieves its receipt; never creates a second identity or Auth user.
    return receipt.command_id;
  end if;
  if exists(select 1 from rmc_auth_private.identities where role='S') then
    raise exception using errcode='22023',message='AUTH_DAY_ZERO_ALREADY_INITIALIZED';
  end if;
  insert into rmc_auth_private.identities(id,role) values(p_identity,'S');
  select generation into policy_generation from rmc_auth_private.cpf_lookup_policy where id for share;
  perform rmc_auth_api.write_cpf_source(p_identity,1,policy_generation,0,p_cpf_key,p_cpf_cipher,p_lookup_versions,p_cpf_hashes);
  insert into rmc_auth_private.provisioning_phone_sources(identity_id,identity_generation,key_version,ciphertext)
    values(p_identity,1,p_phone_key,p_phone_cipher);
  insert into rmc_auth_private.identity_lookups(identity_id,lookup_type,key_version,lookup_hash)
    values(p_identity,'PHONE',p_phone_key,p_phone_hash);
  perform rmc_auth_api.claim_command(p_command,p_key,p_intent,'PROVISION_IDENTITY',null,p_identity);
  insert into rmc_auth_private.day_zero_receipt(command_id,operator_id) values(p_command,p_operator);
  return p_command;
end $$;

create function rmc_auth_private.finish_day_zero(p_command uuid,p_operator uuid,p_request uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare receipt rmc_auth_private.day_zero_receipt%rowtype;
  cmd rmc_auth_private.command_ledger%rowtype; event_id uuid;
begin
  if current_user<>'postgres' or p_operator is null or p_request is null then return false; end if;
  perform pg_advisory_xact_lock(73041001);
  select * into receipt from rmc_auth_private.day_zero_receipt where singleton for update;
  if receipt.command_id is distinct from p_command or receipt.operator_id is distinct from p_operator then return false; end if;
  if receipt.state='COMPLETE' then return true; end if;
  if receipt.state<>'RESERVED' then return false; end if;
  select * into cmd from rmc_auth_private.command_ledger where command_id=p_command for update;
  if cmd.state<>'COMMITTED' or not exists(select 1 from rmc_auth_private.identities
    where id=cmd.target_identity_id and role='S' and lifecycle='PENDING' and onboarding='ACTIVATION_REQUIRED'
      and provider_subject is not null) then return false; end if;
  insert into rmc_auth_private.audit_events(event_type,request_id,command_id,identity_id,generation,outcome,
    reason_code,contract_version,deployment_id) values('ADMIN_COMMAND_OUTCOME',p_request::text,p_command,
    cmd.target_identity_id,1,'SUCCESS','DAY_ZERO_COMPLETE','1.1','LOCAL') returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  update rmc_auth_private.day_zero_receipt set state='COMPLETE',closed_at=clock_timestamp() where singleton;
  return true;
end $$;
revoke execute on function rmc_auth_private.begin_day_zero(uuid,uuid,uuid,bytea,uuid,integer,bytea,integer[],bytea[],integer,bytea,bytea),
  rmc_auth_private.finish_day_zero(uuid,uuid,uuid) from public,anon,authenticated,service_role;

create table rmc_auth_private.provisioning_reconciler (
  singleton boolean primary key default true check(singleton),
  owner uuid, fence bigint not null default 0 check(fence>=0), lease_until timestamptz,
  failures integer not null default 0 check(failures between 0 and 3),
  open_until timestamptz,
  check((owner is null)=(lease_until is null))
);
insert into rmc_auth_private.provisioning_reconciler(singleton) values(true);
alter table rmc_auth_private.provisioning_reconciler enable row level security;
alter table rmc_auth_private.provisioning_reconciler force row level security;
create table rmc_auth_private.provisioning_escalations (
  command_id uuid primary key references rmc_auth_private.command_ledger(command_id),
  reason text not null check(reason in ('BUDGET_EXHAUSTED','DEADLINE_EXPIRED','OWNERSHIP_CONFLICT')),
  created_at timestamptz not null default clock_timestamp()
);
alter table rmc_auth_private.provisioning_escalations enable row level security;
alter table rmc_auth_private.provisioning_escalations force row level security;

create function rmc_auth_api.claim_provisioning_batch(p_owner uuid,p_limit integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare runtime rmc_auth_private.provisioning_reconciler%rowtype; commands jsonb;
begin
  if p_owner is null or p_limit is null or p_limit not between 1 and 3 then
    raise exception using errcode='22023',message='AUTH_RECONCILE_BATCH_INVALID';
  end if;
  select * into runtime from rmc_auth_private.provisioning_reconciler where singleton for update;
  if runtime.lease_until>clock_timestamp() or runtime.open_until>clock_timestamp() then return null; end if;
  update rmc_auth_private.provisioning_reconciler set owner=p_owner,fence=fence+1,
    lease_until=clock_timestamp()+interval '30 seconds' where singleton returning * into runtime;
  -- Escalation is durable and non-destructive. Retain UUID/CPF/ledger even after exhaustion.
  insert into rmc_auth_private.provisioning_escalations(command_id,reason)
    select command_id,case when reconcile_attempts>=8 then 'BUDGET_EXHAUSTED' else 'DEADLINE_EXPIRED' end
    from rmc_auth_private.provider_reservations
    where state in ('RESERVED','UNKNOWN','CONFIRMED') and (reconcile_attempts>=8 or reconcile_deadline<=clock_timestamp())
    order by command_id limit 100 on conflict(command_id) do nothing;
  select coalesce(jsonb_agg(command_id),'[]'::jsonb) into commands from (
    select r.command_id from rmc_auth_private.provider_reservations r
    join rmc_auth_private.command_ledger c on c.command_id=r.command_id
    where r.state in ('RESERVED','UNKNOWN','CONFIRMED') and lease_expires_at<=clock_timestamp()
      and c.state in ('EFFECT_REQUESTED','RECONCILIATION_REQUIRED','EFFECT_CONFIRMED')
      and next_reconcile_at<=clock_timestamp() and reconcile_deadline>clock_timestamp() and reconcile_attempts<8
      and r.command_id not in (select command_id from rmc_auth_private.provisioning_escalations)
    order by next_reconcile_at,r.command_id limit p_limit
  ) due;
  return jsonb_build_object('fence',runtime.fence,'commandIds',commands);
end $$;

create function rmc_auth_api.settle_provisioning_batch(p_owner uuid,p_fence bigint,p_healthy boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
declare runtime rmc_auth_private.provisioning_reconciler%rowtype; v_failures integer;
begin
  select * into runtime from rmc_auth_private.provisioning_reconciler where singleton for update;
  if runtime.owner is distinct from p_owner or runtime.fence is distinct from p_fence
    or runtime.lease_until<=clock_timestamp() or p_healthy is null then return false; end if;
  v_failures:=case when p_healthy then 0 else least(3,runtime.failures+1) end;
  update rmc_auth_private.provisioning_reconciler set owner=null,lease_until=null,
    failures=v_failures,open_until=case when v_failures=3 then clock_timestamp()+interval '60 seconds' else null end
    where singleton;
  return true;
end $$;
revoke execute on function rmc_auth_api.claim_provisioning_batch(uuid,integer),
  rmc_auth_api.settle_provisioning_batch(uuid,bigint,boolean) from public,anon,authenticated;
grant execute on function rmc_auth_api.claim_provisioning_batch(uuid,integer),
  rmc_auth_api.settle_provisioning_batch(uuid,bigint,boolean) to service_role;
grant select,update(owner,fence,lease_until,failures,open_until) on rmc_auth_private.provisioning_reconciler to service_role;
grant select,insert on rmc_auth_private.provisioning_escalations to service_role;

-- Safe compensation is a quarantine, not blind deletion. Operator protocol only.
create table rmc_auth_private.provisioning_compensations (
  command_id uuid primary key references rmc_auth_private.command_ledger(command_id),
  identity_id uuid not null references rmc_auth_private.identities(id),
  provider_subject uuid not null,
  ownership_binding uuid not null,
  fenced_generation bigint not null check(fenced_generation>0),
  state text not null default 'FENCED' check(state in ('FENCED','PROVIDER_BLOCKED','DELETED','ESCALATED')),
  created_at timestamptz not null default clock_timestamp()
);
alter table rmc_auth_private.provisioning_compensations enable row level security;
alter table rmc_auth_private.provisioning_compensations force row level security;
create function rmc_auth_private.fence_provisioning_compensation(p_command uuid,p_owner uuid,p_fence bigint,p_request uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare r rmc_auth_private.provider_reservations%rowtype; ident rmc_auth_private.identities%rowtype;
  event_id uuid;
begin
  if current_user<>'postgres' or p_request is null then return false; end if;
  perform command_id from rmc_auth_private.command_ledger where command_id=p_command for update;
  select * into r from rmc_auth_private.provider_reservations where command_id=p_command for update;
  if r.command_id is null or r.lease_owner is distinct from p_owner or r.fence is distinct from p_fence
    or r.lease_expires_at<=clock_timestamp() or r.state<>'CONFIRMED' then return false; end if;
  select * into ident from rmc_auth_private.identities where id=r.identity_id for update;
  if exists(select 1 from rmc_auth_private.provisioning_compensations where command_id=p_command) then return true; end if;
  if ident.lifecycle<>'PENDING' or ident.generation<>r.identity_generation or ident.provider_subject is not null then return false; end if;
  update rmc_auth_private.identities set lifecycle='DISABLED',generation=generation+1,context_version=context_version+1,
    updated_at=clock_timestamp() where id=ident.id;
  update rmc_auth_private.functional_sessions set revoked_at=clock_timestamp() where identity_id=ident.id and revoked_at is null;
  insert into rmc_auth_private.provisioning_compensations(command_id,identity_id,provider_subject,ownership_binding,fenced_generation)
    values(p_command,ident.id,r.provider_subject,r.ownership_binding,ident.generation+1);
  insert into rmc_auth_private.audit_events(event_type,request_id,command_id,identity_id,generation,outcome,
    reason_code,contract_version,deployment_id) values('ADMIN_COMMAND_OUTCOME',p_request::text,p_command,
    ident.id,ident.generation+1,'FAILURE','PROVISION_COMPENSATION_FENCED','1.1','LOCAL') returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  return true;
end $$;
revoke execute on function rmc_auth_private.fence_provisioning_compensation(uuid,uuid,bigint,uuid)
  from public,anon,authenticated,service_role;
