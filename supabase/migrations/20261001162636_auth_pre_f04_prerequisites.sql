-- Pre-F04 foundations only. No provider call, no public endpoint, no NORMAL promotion.
create table rmc_auth_private.cpf_lookup_policy (
  id boolean primary key default true check (id),
  generation bigint not null default 1 check (generation > 0),
  active_version integer not null default 1 check (active_version > 0),
  pending_version integer check (pending_version > active_version)
);
insert into rmc_auth_private.cpf_lookup_policy (id) values (true);

-- A staged CPF alias is not a retired authority: only verified cutover may activate it.
alter table rmc_auth_private.identity_lookups add column cpf_staged boolean not null default false,
  add constraint cpf_staging_shape check(not cpf_staged or (lookup_type='CPF' and not is_current));
drop trigger lookups_authority_guard on rmc_auth_private.identity_lookups;
create function rmc_auth_private.guard_lookup_rotation()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if (new.id,new.identity_id,new.lookup_type,new.key_version,new.lookup_hash,new.created_at)
    is distinct from (old.id,old.identity_id,old.lookup_type,old.key_version,old.lookup_hash,old.created_at)
    or (not old.cpf_staged and new.cpf_staged)
    or (not old.is_current and new.is_current and not (
      old.cpf_staged and not new.cpf_staged and old.lookup_type='CPF'
      and exists(select 1 from rmc_auth_private.cpf_lookup_policy where id and pending_version=old.key_version))) then
    raise exception using errcode='23514',message='AUTH_LOOKUP_IMMUTABLE';
  end if;
  return new;
end $$;
create trigger lookups_authority_guard before update on rmc_auth_private.identity_lookups
  for each row execute function rmc_auth_private.guard_lookup_rotation();

create table rmc_auth_private.cpf_sources (
  identity_id uuid primary key references rmc_auth_private.identities(id),
  identity_generation bigint not null check (identity_generation > 0),
  revision bigint not null check (revision > 0),
  codec_version integer not null check (codec_version = 1),
  algorithm text not null check (algorithm = 'A256GCM'),
  purpose text not null check (purpose = 'CPF'),
  key_version integer not null check (key_version > 0),
  ciphertext bytea not null check (octet_length(ciphertext) = 39),
  updated_at timestamptz not null default clock_timestamp()
);
create function rmc_auth_private.guard_cpf_source()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' and ((new.identity_id,new.codec_version,new.algorithm,new.purpose)
    is distinct from (old.identity_id,old.codec_version,old.algorithm,old.purpose)
    or new.revision<>old.revision+1 or new.identity_generation<old.identity_generation) then
    raise exception using errcode='23514',message='AUTH_CPF_SOURCE_IMMUTABLE';
  end if;
  perform id from rmc_auth_private.identities where id=new.identity_id
    and generation=new.identity_generation and lifecycle<>'DELETED' for share;
  if not found then raise exception using errcode='23514',message='AUTH_CPF_IDENTITY_INVALID'; end if;
  return new;
end $$;
create trigger cpf_source_guard before insert or update on rmc_auth_private.cpf_sources
  for each row execute function rmc_auth_private.guard_cpf_source();

-- All required hashes are computed in the trusted crypto boundary; SQL receives no CPF.
-- Lock ordering: policy -> identity -> source -> lookups, shared by every writer.
create function rmc_auth_api.write_cpf_source(
  p_identity uuid, p_identity_generation bigint, p_policy_generation bigint,
  p_revision bigint, p_key_version integer, p_ciphertext bytea,
  p_versions integer[], p_hashes bytea[]
) returns bigint language plpgsql security invoker set search_path = '' as $$
declare
  policy rmc_auth_private.cpf_lookup_policy%rowtype;
  ident rmc_auth_private.identities%rowtype;
  required integer[];
  existing_hash bytea;
  next_revision bigint;
begin
  select * into policy from rmc_auth_private.cpf_lookup_policy where id for share;
  required := case when policy.pending_version is null then array[policy.active_version]
    else array[policy.active_version,policy.pending_version] end;
  if p_policy_generation is distinct from policy.generation or p_revision is null or p_revision < 0
    or p_versions is distinct from required or p_hashes is null
    or array_ndims(p_hashes) is distinct from 1 or array_lower(p_hashes,1) is distinct from 1
    or cardinality(p_hashes) <> cardinality(required) or p_key_version is null or p_key_version < 1
    or p_ciphertext is null or octet_length(p_ciphertext) <> 39 then
    raise exception using errcode='22023',message='AUTH_CPF_INPUT_INVALID';
  end if;
  select * into ident from rmc_auth_private.identities where id=p_identity for update;
  if ident.id is null or ident.lifecycle='DELETED' or ident.generation is distinct from p_identity_generation then
    raise exception using errcode='22023',message='AUTH_CPF_IDENTITY_INVALID';
  end if;
  if exists(select 1 from rmc_auth_private.identity_lookups where identity_id=p_identity and lookup_type='CPF')
    and not exists(select 1 from rmc_auth_private.identity_lookups
      where identity_id=p_identity and lookup_type='CPF' and key_version=policy.active_version) then
    raise exception using errcode='22023',message='AUTH_CPF_LOOKUP_VERSION_INVALID';
  end if;
  select revision into next_revision from rmc_auth_private.cpf_sources where identity_id=p_identity for update;
  if coalesce(next_revision,0) <> p_revision then
    raise exception using errcode='40001',message='AUTH_CPF_STALE_REVISION';
  end if;
  for idx in 1..cardinality(required) loop
    if p_hashes[idx] is null or octet_length(p_hashes[idx]) <> 32 then
      raise exception using errcode='22023',message='AUTH_CPF_INPUT_INVALID';
    end if;
    select lookup_hash into existing_hash from rmc_auth_private.identity_lookups
      where identity_id=p_identity and lookup_type='CPF' and key_version=required[idx];
    if found and existing_hash is distinct from p_hashes[idx] then
      raise exception using errcode='23505',message='AUTH_CPF_IMMUTABLE';
    end if;
    insert into rmc_auth_private.identity_lookups(identity_id,lookup_type,key_version,lookup_hash,is_current,retired_at,cpf_staged)
      values(p_identity,'CPF',required[idx],p_hashes[idx],required[idx]=policy.active_version,
        case when required[idx]=policy.active_version then null else clock_timestamp() end,required[idx]<>policy.active_version)
      on conflict (identity_id,lookup_type,key_version) do nothing;
  end loop;
  next_revision := p_revision+1;
  insert into rmc_auth_private.cpf_sources(identity_id,identity_generation,revision,codec_version,algorithm,purpose,key_version,ciphertext)
    values(p_identity,p_identity_generation,next_revision,1,'A256GCM','CPF',p_key_version,p_ciphertext)
    on conflict(identity_id) do update set identity_generation=excluded.identity_generation,
      revision=excluded.revision,key_version=excluded.key_version,ciphertext=excluded.ciphertext,updated_at=clock_timestamp();
  return next_revision;
end $$;

-- Administrative rotation RPCs have no EXECUTE grant to service_role.
create function rmc_auth_api.begin_cpf_rotation(p_generation bigint,p_version integer)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare policy rmc_auth_private.cpf_lookup_policy%rowtype;
begin
  select * into policy from rmc_auth_private.cpf_lookup_policy where id for update;
  if policy.generation is distinct from p_generation or policy.pending_version is not null
    or p_version is null or p_version <= policy.active_version
    or exists(select 1 from rmc_auth_private.identity_lookups l where l.lookup_type='CPF'
      and not exists(select 1 from rmc_auth_private.cpf_sources s where s.identity_id=l.identity_id)) then
    raise exception using errcode='22023',message='AUTH_CPF_ROTATION_INVALID';
  end if;
  update rmc_auth_private.cpf_lookup_policy set pending_version=p_version,generation=generation+1 where id;
  return policy.generation+1;
end $$;

create function rmc_auth_api.finish_cpf_rotation(p_generation bigint,p_rollback boolean default false)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare policy rmc_auth_private.cpf_lookup_policy%rowtype;
begin
  select * into policy from rmc_auth_private.cpf_lookup_policy where id for update;
  if policy.generation is distinct from p_generation or policy.pending_version is null or p_rollback is null then
    raise exception using errcode='22023',message='AUTH_CPF_ROTATION_INVALID';
  end if;
  if not p_rollback then
    if exists(select 1 from rmc_auth_private.cpf_sources s
      where not exists(select 1 from rmc_auth_private.identity_lookups l
        where l.identity_id=s.identity_id and l.lookup_type='CPF' and l.key_version=policy.pending_version)) then
      raise exception using errcode='22023',message='AUTH_CPF_BACKFILL_INCOMPLETE';
    end if;
    update rmc_auth_private.identity_lookups set is_current=false,retired_at=clock_timestamp()
      where lookup_type='CPF' and is_current;
    update rmc_auth_private.identity_lookups set is_current=true,retired_at=null,cpf_staged=false
      where lookup_type='CPF' and key_version=policy.pending_version;
  end if;
  update rmc_auth_private.cpf_lookup_policy set active_version=case when p_rollback then active_version else pending_version end,
    pending_version=null,generation=generation+1 where id;
  -- Historical hashes remain unique, including rollback; retirement is not erasure.
  return policy.generation+1;
end $$;

create table rmc_auth_private.provider_reservations (
  command_id uuid primary key references rmc_auth_private.command_ledger(command_id),
  identity_id uuid not null references rmc_auth_private.identities(id),
  provider_subject uuid not null unique default gen_random_uuid(),
  ownership_binding uuid not null unique default gen_random_uuid(),
  identity_generation bigint not null check (identity_generation > 0),
  fence bigint not null default 1 check (fence > 0),
  lease_owner uuid not null,
  lease_expires_at timestamptz not null,
  state text not null default 'RESERVED' check(state in ('RESERVED','UNKNOWN','CONFIRMED','COMMITTED','ABORTED')),
  confirmed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  check ((state in ('CONFIRMED','COMMITTED')) = (confirmed_at is not null))
);
create unique index provider_one_current_reservation_idx on rmc_auth_private.provider_reservations(identity_id)
  where state<>'ABORTED';

create function rmc_auth_private.guard_provider_reservation()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if (new.command_id,new.identity_id,new.provider_subject,new.ownership_binding,new.identity_generation,new.created_at)
    is distinct from (old.command_id,old.identity_id,old.provider_subject,old.ownership_binding,old.identity_generation,old.created_at)
    or new.fence<old.fence or new.fence>old.fence+1
    or (new.lease_owner is distinct from old.lease_owner and new.fence<>old.fence+1)
    or (new.lease_expires_at is distinct from old.lease_expires_at and new.fence<>old.fence+1)
    or (old.state in ('COMMITTED','ABORTED') and new is distinct from old)
    or (old.confirmed_at is not null and new.confirmed_at is distinct from old.confirmed_at)
    or (new.state<>old.state and not (
      (old.state='RESERVED' and new.state in ('UNKNOWN','CONFIRMED','ABORTED'))
      or (old.state='UNKNOWN' and new.state in ('CONFIRMED','ABORTED'))
      or (old.state='CONFIRMED' and new.state='COMMITTED')))
    or (old.state='CONFIRMED' and new.state not in ('CONFIRMED','COMMITTED')) then
    raise exception using errcode='23514',message='AUTH_PROVISION_IMMUTABLE';
  end if;
  return new;
end $$;
create trigger provider_reservation_guard before update on rmc_auth_private.provider_reservations
  for each row execute function rmc_auth_private.guard_provider_reservation();

create function rmc_auth_api.reserve_provider(p_command uuid,p_generation bigint,p_owner uuid)
returns rmc_auth_private.provider_reservations language plpgsql security invoker set search_path = '' as $$
declare
  cmd rmc_auth_private.command_ledger%rowtype;
  ident rmc_auth_private.identities%rowtype;
  reservation rmc_auth_private.provider_reservations%rowtype;
begin
  select * into cmd from rmc_auth_private.command_ledger where command_id=p_command for update;
  if cmd.command_id is null or cmd.command_type <> 'PROVISION_IDENTITY' or cmd.target_identity_id is null
    or cmd.state not in ('CLAIMED','EFFECT_REQUESTED','RECONCILIATION_REQUIRED','EFFECT_CONFIRMED','COMMITTED','FAILED_CONFIRMED')
    or p_owner is null or p_generation is null then
    raise exception using errcode='22023',message='AUTH_PROVISION_COMMAND_INVALID';
  end if;
  select * into reservation from rmc_auth_private.provider_reservations where command_id=p_command;
  if found then
    if reservation.identity_generation is distinct from p_generation then
      raise exception using errcode='22023',message='AUTH_PROVISION_BINDING_INVALID';
    end if;
    return reservation;
  end if;
  if cmd.state<>'CLAIMED' then
    raise exception using errcode='22023',message='AUTH_PROVISION_COMMAND_INVALID';
  end if;
  select * into ident from rmc_auth_private.identities where id=cmd.target_identity_id for update;
  if ident.lifecycle is distinct from 'PENDING'::rmc_auth_private.identity_lifecycle
    or ident.generation is distinct from p_generation or ident.provider_subject is not null
    or not exists(select 1 from rmc_auth_private.cpf_sources where identity_id=ident.id and identity_generation=p_generation) then
    raise exception using errcode='22023',message='AUTH_PROVISION_IDENTITY_INVALID';
  end if;
  insert into rmc_auth_private.provider_reservations(command_id,identity_id,identity_generation,lease_owner,lease_expires_at)
    values(p_command,ident.id,p_generation,p_owner,clock_timestamp()+interval '30 seconds') returning * into reservation;
  update rmc_auth_private.command_ledger set state='EFFECT_REQUESTED',updated_at=clock_timestamp() where command_id=p_command;
  return reservation;
end $$;

create function rmc_auth_api.claim_provider_reconciliation(p_command uuid,p_owner uuid)
returns rmc_auth_private.provider_reservations language plpgsql security invoker set search_path = '' as $$
declare reservation rmc_auth_private.provider_reservations%rowtype;
begin
  if p_owner is null then raise exception using errcode='22023',message='AUTH_PROVISION_BINDING_INVALID'; end if;
  update rmc_auth_private.provider_reservations set fence=fence+1,lease_owner=p_owner,
    lease_expires_at=clock_timestamp()+interval '30 seconds'
    where command_id=p_command and lease_expires_at<=clock_timestamp() and state in ('RESERVED','UNKNOWN','CONFIRMED')
    returning * into reservation;
  return reservation;
end $$;

-- Trust boundary: proof must have been decoded and checked by the provider adapter in F04.
-- Metadata alone is not an adoption proof; this RPC never discovers/adopts arbitrary users.
create function rmc_auth_api.record_provider_outcome(p_command uuid,p_owner uuid,p_fence bigint,
  p_provider uuid,p_binding uuid,p_outcome text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare reservation rmc_auth_private.provider_reservations%rowtype;
begin
  perform command_id from rmc_auth_private.command_ledger where command_id=p_command for update;
  select * into reservation from rmc_auth_private.provider_reservations where command_id=p_command for update;
  if reservation.command_id is null or reservation.lease_owner is distinct from p_owner
    or reservation.fence is distinct from p_fence or reservation.provider_subject is distinct from p_provider
    or reservation.ownership_binding is distinct from p_binding or reservation.lease_expires_at<=clock_timestamp()
    or p_outcome is null or p_outcome not in ('OWNED','UNKNOWN','ABSENT')
    or reservation.state not in ('RESERVED','UNKNOWN','CONFIRMED') then return false; end if;
  -- ABSENT may abort only before confirmed ownership; timeout must be UNKNOWN.
  if p_outcome='ABSENT' and reservation.state='CONFIRMED' then return false; end if;
  if reservation.state='CONFIRMED' and p_outcome='UNKNOWN' then return false; end if;
  update rmc_auth_private.provider_reservations set state=case p_outcome when 'OWNED' then 'CONFIRMED'
    when 'ABSENT' then 'ABORTED' else 'UNKNOWN' end,
    confirmed_at=case when p_outcome='OWNED' then coalesce(confirmed_at,clock_timestamp()) else null end
    where command_id=p_command;
  update rmc_auth_private.command_ledger set state=case p_outcome
    when 'OWNED' then 'EFFECT_CONFIRMED'::rmc_auth_private.command_state
    when 'ABSENT' then 'FAILED_CONFIRMED'::rmc_auth_private.command_state
    else 'RECONCILIATION_REQUIRED'::rmc_auth_private.command_state end,
    reconcile_after=case when p_outcome='UNKNOWN' then clock_timestamp() else null end,
    updated_at=clock_timestamp() where command_id=p_command;
  return true;
end $$;

create function rmc_auth_api.commit_provider_reservation(p_command uuid,p_owner uuid,p_fence bigint,
  p_request uuid,p_deployment text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  reservation rmc_auth_private.provider_reservations%rowtype;
  cmd rmc_auth_private.command_ledger%rowtype;
  ident rmc_auth_private.identities%rowtype;
  event_id uuid;
begin
  select * into cmd from rmc_auth_private.command_ledger where command_id=p_command for update;
  select * into reservation from rmc_auth_private.provider_reservations where command_id=p_command for update;
  if reservation.command_id is null or reservation.lease_owner is distinct from p_owner
    or reservation.fence is distinct from p_fence or p_request is null
    or p_deployment is null or p_deployment not in ('LOCAL','LOCAL_PRODUCTION_LIKE','STAGING','PRODUCTION') then return false; end if;
  if reservation.state='COMMITTED' then return true; end if;
  if reservation.state<>'CONFIRMED' or reservation.lease_expires_at<=clock_timestamp()
    or cmd.target_identity_id is distinct from reservation.identity_id then return false; end if;
  -- Lifecycle of a bound actor is revalidated; full session/capability/scope proof remains F04/F10.
  perform id from rmc_auth_private.identities where id in (cmd.actor_identity_id,reservation.identity_id) order by id for update;
  if cmd.actor_identity_id is not null and not exists(select 1 from rmc_auth_private.identities
    where id=cmd.actor_identity_id and lifecycle='ACTIVE') then return false; end if;
  select * into ident from rmc_auth_private.identities where id=reservation.identity_id for update;
  if ident.generation<>reservation.identity_generation or ident.lifecycle<>'PENDING' or ident.provider_subject is not null
    or cmd.state not in ('CLAIMED','EFFECT_REQUESTED','RECONCILIATION_REQUIRED','EFFECT_CONFIRMED') then return false; end if;
  -- Never promote onboarding/lifecycle/NORMAL here. Actor/scope authorization is F04/F10 boundary work.
  update rmc_auth_private.identities set provider_subject=reservation.provider_subject where id=ident.id;
  insert into rmc_auth_private.audit_events(event_type,request_id,command_id,identity_id,generation,outcome,
    reason_code,contract_version,deployment_id) values('ADMIN_COMMAND_OUTCOME',p_request::text,p_command,
      ident.id,ident.generation,'SUCCESS','PROVISION_COMMITTED','1.1',p_deployment) returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  update rmc_auth_private.provider_reservations set state='COMMITTED' where command_id=p_command;
  update rmc_auth_private.command_ledger set state='COMMITTED',result_code='PROVISION_COMMITTED',
    result_payload=jsonb_build_object('identityId',ident.id),updated_at=clock_timestamp() where command_id=p_command;
  return true;
end $$;

alter table rmc_auth_private.cpf_lookup_policy enable row level security;
alter table rmc_auth_private.cpf_lookup_policy force row level security;
alter table rmc_auth_private.cpf_sources enable row level security;
alter table rmc_auth_private.cpf_sources force row level security;
alter table rmc_auth_private.provider_reservations enable row level security;
alter table rmc_auth_private.provider_reservations force row level security;
create function rmc_auth_api.read_cpf_policy()
returns rmc_auth_private.cpf_lookup_policy language sql stable security invoker set search_path='' as $$
  select p from rmc_auth_private.cpf_lookup_policy p where id;
$$;
create function rmc_auth_api.read_cpf_source(p_identity uuid,p_generation bigint)
returns rmc_auth_private.cpf_sources language sql stable security invoker set search_path='' as $$
  select s from rmc_auth_private.cpf_sources s join rmc_auth_private.identities i on i.id=s.identity_id
    -- Current identity fence authorizes retrieval; persisted generation remains the crypto binding.
    -- Changing lifecycle/generation must not make controlled rotation/reseal impossible.
    where s.identity_id=p_identity and i.generation=p_generation and i.lifecycle<>'DELETED';
$$;
create function rmc_auth_api.read_provider_reservation(p_command uuid)
returns rmc_auth_private.provider_reservations language sql stable security invoker set search_path='' as $$
  select r from rmc_auth_private.provider_reservations r where r.command_id=p_command;
$$;
revoke execute on function rmc_auth_api.read_cpf_policy(),rmc_auth_api.read_cpf_source(uuid,bigint),
  rmc_auth_api.read_provider_reservation(uuid) from public,anon,authenticated;
grant execute on function rmc_auth_api.read_cpf_policy(),rmc_auth_api.read_cpf_source(uuid,bigint),
  rmc_auth_api.read_provider_reservation(uuid) to service_role;
revoke all on rmc_auth_private.cpf_lookup_policy,rmc_auth_private.cpf_sources,rmc_auth_private.provider_reservations from public,anon,authenticated;
grant select on rmc_auth_private.cpf_lookup_policy to service_role;
grant update(id) on rmc_auth_private.cpf_lookup_policy to service_role;
grant select,insert,update on rmc_auth_private.cpf_sources,rmc_auth_private.provider_reservations to service_role;
grant execute on function rmc_auth_private.guard_provider_reservation(),rmc_auth_private.guard_lookup_rotation(),
  rmc_auth_private.guard_cpf_source() to service_role;
grant select,insert on rmc_auth_private.identity_lookups to service_role;
grant usage,select on sequence rmc_auth_private.identity_lookups_id_seq to service_role;
grant update(provider_subject) on rmc_auth_private.identities to service_role;
grant update(state,result_code,result_payload,reconcile_after,updated_at) on rmc_auth_private.command_ledger to service_role;
grant insert on rmc_auth_private.audit_events,rmc_auth_private.audit_outbox to service_role;
grant select(id) on rmc_auth_private.audit_events to service_role;
revoke execute on function rmc_auth_api.write_cpf_source(uuid,bigint,bigint,bigint,integer,bytea,integer[],bytea[]),
  rmc_auth_api.begin_cpf_rotation(bigint,integer),rmc_auth_api.finish_cpf_rotation(bigint,boolean),
  rmc_auth_api.reserve_provider(uuid,bigint,uuid),rmc_auth_api.claim_provider_reconciliation(uuid,uuid),
  rmc_auth_api.record_provider_outcome(uuid,uuid,bigint,uuid,uuid,text),
  rmc_auth_api.commit_provider_reservation(uuid,uuid,bigint,uuid,text) from public,anon,authenticated;
grant execute on function rmc_auth_api.write_cpf_source(uuid,bigint,bigint,bigint,integer,bytea,integer[],bytea[]),
  rmc_auth_api.reserve_provider(uuid,bigint,uuid),rmc_auth_api.claim_provider_reconciliation(uuid,uuid),
  rmc_auth_api.record_provider_outcome(uuid,uuid,bigint,uuid,uuid,text),
  rmc_auth_api.commit_provider_reservation(uuid,uuid,bigint,uuid,text) to service_role;

alter table rmc_auth_private.audit_events drop constraint audit_reason_allowlist;
alter table rmc_auth_private.audit_events add constraint audit_reason_allowlist check (reason_code in (
  'VERIFIED','REVOKED','COMMITTED','ACCEPTED','DELIVERED','EXPIRED','STALE','RECONCILIATION_REQUIRED',
  'AUTH_INVALID_REQUEST','AUTH_SESSION_INVALID','AUTH_CREDENTIALS_INVALID','AUTH_ORIGIN_DENIED',
  'AUTH_CSRF_INVALID','AUTH_ACCESS_DENIED','AUTH_STEP_UP_REQUIRED','RESOURCE_NOT_FOUND',
  'AUTH_STATE_CONFLICT','AUTH_BODY_TOO_LARGE','AUTH_UNSUPPORTED_MEDIA_TYPE','AUTH_RATE_LIMITED',
  'AUTH_CONFIGURATION_ERROR','AUTH_UNEXPECTED_ERROR','AUTH_PROVIDER_FAILURE',
  'AUTH_DEPENDENCY_UNAVAILABLE','AUTH_DEPENDENCY_TIMEOUT','PROVISION_RESERVED','PROVISION_COMMITTED',
  'PROVIDER_OUTCOME_UNKNOWN','OWNERSHIP_CONFLICT','STALE_FENCE','RECONCILIATION_CONFIRMED'));
alter table rmc_auth_private.command_ledger drop constraint commands_result_sanitized;
alter table rmc_auth_private.command_ledger add constraint commands_result_sanitized check (
  result_payload is null or result_payload='{}'::jsonb or (
    command_type='PROVISION_IDENTITY' and state='COMMITTED' and target_identity_id is not null
    and result_payload=jsonb_build_object('identityId',target_identity_id)));
