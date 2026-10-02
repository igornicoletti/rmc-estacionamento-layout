alter table rmc_auth_private.audit_events drop constraint audit_reason_allowlist;
alter table rmc_auth_private.audit_events add constraint audit_reason_allowlist check (reason_code in (
  'VERIFIED','REVOKED','COMMITTED','ACCEPTED','DELIVERED','EXPIRED','STALE','RECONCILIATION_REQUIRED',
  'AUTH_INVALID_REQUEST','AUTH_SESSION_INVALID','AUTH_CREDENTIALS_INVALID','AUTH_ORIGIN_DENIED',
  'AUTH_CSRF_INVALID','AUTH_ACCESS_DENIED','AUTH_STEP_UP_REQUIRED','RESOURCE_NOT_FOUND',
  'AUTH_STATE_CONFLICT','AUTH_BODY_TOO_LARGE','AUTH_UNSUPPORTED_MEDIA_TYPE','AUTH_RATE_LIMITED',
  'AUTH_CONFIGURATION_ERROR','AUTH_UNEXPECTED_ERROR','AUTH_PROVIDER_FAILURE',
  'AUTH_DEPENDENCY_UNAVAILABLE','AUTH_DEPENDENCY_TIMEOUT','PROVISION_RESERVED','PROVISION_COMMITTED',
  'PROVIDER_OUTCOME_UNKNOWN','OWNERSHIP_CONFLICT','STALE_FENCE','RECONCILIATION_CONFIRMED',
  'DAY_ZERO_COMPLETE','PROVISION_COMPENSATION_FENCED','PROVISION_COMPENSATED',
  'PASSWORD_PROVED','TOTP_ENROLLED','TOTP_VERIFIED','ACTIVATION_COMPLETE'));

create table rmc_auth_private.activation_totp_state (
  identity_id uuid primary key references rmc_auth_private.identities(id),
  bootstrap_session_id uuid not null references rmc_auth_private.functional_sessions(id),
  command_id uuid not null unique,
  lease_owner uuid not null,
  fence bigint not null default 1 check(fence>0),
  lease_expires_at timestamptz not null,
  attempts integer not null default 1 check(attempts between 1 and 3),
  factor_id uuid unique,
  state text not null default 'CLAIMED' check(state in ('CLAIMED','ENROLLED','VERIFIED')),
  created_at timestamptz not null default clock_timestamp(),
  verified_at timestamptz,
  check((state='CLAIMED')=(factor_id is null)),
  check((state='VERIFIED')=(verified_at is not null))
);
alter table rmc_auth_private.activation_totp_state enable row level security;
alter table rmc_auth_private.activation_totp_state force row level security;
revoke all on rmc_auth_private.activation_totp_state from public,anon,authenticated;
grant select,insert on rmc_auth_private.activation_totp_state to service_role;
grant update(lease_owner,fence,lease_expires_at,attempts,factor_id,state,verified_at)
  on rmc_auth_private.activation_totp_state to service_role;

create function rmc_auth_api.read_activation_security_setup(p_cookie bytea,p_csrf bytea)
returns jsonb language sql security invoker set search_path='' as $$
  select jsonb_build_object('identityId',i.id,'sessionId',s.id,
    'providerSubject',i.provider_subject,'generation',i.generation,'role',i.role,
    'reservationCommand',r.command_id,'ownershipBinding',r.ownership_binding,
    'ciphertext',encode(p.provider_access_ciphertext,'hex'),
    'keyVersion',p.provider_key_version,'providerExpiresAt',p.provider_access_expires_at,
    'factorId',t.factor_id,'factorState',t.state)
  from rmc_auth_private.functional_sessions s
  join rmc_auth_private.identities i on i.id=s.identity_id
  join rmc_auth_private.activation_bootstrap b on b.identity_id=i.id and b.session_id=s.id
  join rmc_auth_private.activation_password_state p on p.identity_id=i.id
    and p.bootstrap_session_id=s.id and p.state='PROVED'
  join rmc_auth_private.provider_reservations r on r.identity_id=i.id
    and r.provider_subject=i.provider_subject and r.identity_generation=i.generation
    and r.state='COMMITTED'
  left join rmc_auth_private.activation_totp_state t on t.identity_id=i.id
    and t.bootstrap_session_id=s.id
  where s.cookie_hash=p_cookie and s.purpose='BOOTSTRAP' and s.revoked_at is null
    and s.expires_at>clock_timestamp() and s.idle_expires_at>clock_timestamp()
    and s.identity_generation=i.generation and i.lifecycle='PENDING'
    and i.onboarding='SECURITY_SETUP' and p.provider_access_expires_at>clock_timestamp()+interval '5 minutes'
    and exists(select 1 from rmc_auth_private.csrf_material c
      where c.session_id=s.id and c.generation=s.generation and c.token_hash=p_csrf
        and c.invalidated_at is null and c.expires_at>clock_timestamp());
$$;
revoke all on function rmc_auth_api.read_activation_security_setup(bytea,bytea)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.read_activation_security_setup(bytea,bytea) to service_role;

create function rmc_auth_api.claim_activation_totp(
  p_cookie bytea,p_csrf bytea,p_command uuid,p_owner uuid
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare session_row rmc_auth_private.functional_sessions%rowtype;
  identity_row rmc_auth_private.identities%rowtype;
  state_row rmc_auth_private.activation_totp_state%rowtype;
  now_at timestamptz:=clock_timestamp();
begin
  if octet_length(p_cookie) is distinct from 32 or octet_length(p_csrf) is distinct from 32
    or p_command is null or p_owner is null then return null; end if;
  select * into session_row from rmc_auth_private.functional_sessions where cookie_hash=p_cookie;
  if session_row.id is null then return null; end if;
  select * into identity_row from rmc_auth_private.identities where id=session_row.identity_id for update;
  select * into session_row from rmc_auth_private.functional_sessions where id=session_row.id for update;
  if identity_row.id is null or identity_row.lifecycle<>'PENDING'
    or identity_row.onboarding<>'SECURITY_SETUP'
    or session_row.purpose<>'BOOTSTRAP' or session_row.revoked_at is not null
    or session_row.expires_at<=now_at or session_row.idle_expires_at<=now_at
    or session_row.identity_generation<>identity_row.generation
    or not exists(select 1 from rmc_auth_private.activation_bootstrap b
      where b.identity_id=identity_row.id and b.session_id=session_row.id)
    or not exists(select 1 from rmc_auth_private.csrf_material c
      where c.session_id=session_row.id and c.generation=session_row.generation
        and c.token_hash=p_csrf and c.invalidated_at is null and c.expires_at>now_at)
    or not exists(select 1 from rmc_auth_private.activation_password_state p
      where p.identity_id=identity_row.id and p.bootstrap_session_id=session_row.id
        and p.state='PROVED' and p.provider_access_expires_at>now_at+interval '5 minutes')
  then return null; end if;
  select * into state_row from rmc_auth_private.activation_totp_state
    where identity_id=identity_row.id for update;
  if state_row.identity_id is null then
    insert into rmc_auth_private.activation_totp_state
      (identity_id,bootstrap_session_id,command_id,lease_owner,lease_expires_at)
      values(identity_row.id,session_row.id,p_command,p_owner,now_at+interval '15 seconds')
      returning * into state_row;
  elsif state_row.bootstrap_session_id<>session_row.id or state_row.command_id<>p_command
    or state_row.state<>'CLAIMED' then return null;
  elsif state_row.lease_expires_at>now_at then return '{"busy":true}'::jsonb;
  elsif state_row.attempts>=3 then return null;
  else
    update rmc_auth_private.activation_totp_state set lease_owner=p_owner,
      fence=fence+1,attempts=attempts+1,lease_expires_at=now_at+interval '15 seconds'
      where identity_id=identity_row.id returning * into state_row;
  end if;
  return jsonb_build_object('claimed',true,'identityId',identity_row.id,
    'sessionId',session_row.id,'generation',identity_row.generation,'fence',state_row.fence);
end $$;
revoke all on function rmc_auth_api.claim_activation_totp(bytea,bytea,uuid,uuid)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.claim_activation_totp(bytea,bytea,uuid,uuid) to service_role;

create function rmc_auth_api.record_activation_totp(
  p_identity uuid,p_session uuid,p_command uuid,p_owner uuid,p_fence bigint,p_factor uuid,p_request uuid
) returns boolean language plpgsql security invoker set search_path='' as $$
declare identity_row rmc_auth_private.identities%rowtype;
  session_row rmc_auth_private.functional_sessions%rowtype;
  state_row rmc_auth_private.activation_totp_state%rowtype;
  now_at timestamptz:=clock_timestamp(); event_id uuid;
begin
  if p_factor is null or p_request is null then return false; end if;
  select * into identity_row from rmc_auth_private.identities where id=p_identity for update;
  select * into session_row from rmc_auth_private.functional_sessions where id=p_session for update;
  select * into state_row from rmc_auth_private.activation_totp_state where identity_id=p_identity for update;
  if identity_row.id is null or identity_row.lifecycle<>'PENDING'
    or identity_row.onboarding<>'SECURITY_SETUP'
    or session_row.id is null or session_row.identity_id<>p_identity
    or session_row.purpose<>'BOOTSTRAP' or session_row.revoked_at is not null
    or session_row.expires_at<=now_at or session_row.identity_generation<>identity_row.generation
    or not exists(select 1 from rmc_auth_private.activation_bootstrap b
      where b.identity_id=p_identity and b.session_id=p_session)
    or state_row.identity_id is null or state_row.bootstrap_session_id<>p_session
    or state_row.command_id<>p_command or state_row.lease_owner<>p_owner
    or state_row.fence<>p_fence or state_row.state<>'CLAIMED'
    or state_row.lease_expires_at<=now_at then return false; end if;
  update rmc_auth_private.activation_totp_state set factor_id=p_factor,state='ENROLLED'
    where identity_id=p_identity;
  insert into rmc_auth_private.audit_events
    (event_type,request_id,identity_id,purpose,generation,outcome,reason_code,contract_version,deployment_id)
    values('MFA_OUTCOME',p_request::text,p_identity,'BOOTSTRAP',session_row.generation,
      'SUCCESS','TOTP_ENROLLED','1.1','F06-local') returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  return true;
end $$;
revoke all on function rmc_auth_api.record_activation_totp(uuid,uuid,uuid,uuid,bigint,uuid,uuid)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.record_activation_totp(uuid,uuid,uuid,uuid,bigint,uuid,uuid)
  to service_role;

create table rmc_auth_private.activation_completions (
  command_id uuid primary key,
  bootstrap_session_id uuid not null unique references rmc_auth_private.functional_sessions(id),
  bootstrap_cookie_hash bytea not null check(octet_length(bootstrap_cookie_hash)=32),
  bootstrap_csrf_hash bytea not null check(octet_length(bootstrap_csrf_hash)=32),
  intent_hash bytea not null check(octet_length(intent_hash)=32),
  normal_session_id uuid not null unique references rmc_auth_private.functional_sessions(id),
  context_key_version integer not null check(context_key_version>0),
  factor_id uuid,
  created_at timestamptz not null default clock_timestamp()
);
alter table rmc_auth_private.activation_completions enable row level security;
alter table rmc_auth_private.activation_completions force row level security;
revoke all on rmc_auth_private.activation_completions from public,anon,authenticated;
grant select,insert on rmc_auth_private.activation_completions to service_role;

create function rmc_auth_api.replay_activation_completion(
  p_command uuid,p_bootstrap_cookie bytea,p_bootstrap_csrf bytea,p_intent bytea
) returns jsonb language sql security invoker set search_path='' as $$
  select jsonb_build_object('normalSessionId',n.id,'expiresAt',n.expires_at,
    'idleExpiresAt',n.idle_expires_at,
    'contextKeyVersion',c.context_key_version,'role',i.role,'contextVersion',i.context_version)
  from rmc_auth_private.activation_completions c
  join rmc_auth_private.functional_sessions n on n.id=c.normal_session_id
  join rmc_auth_private.identities i on i.id=n.identity_id
  where c.command_id=p_command and c.bootstrap_cookie_hash=p_bootstrap_cookie
    and c.bootstrap_csrf_hash=p_bootstrap_csrf and c.intent_hash=p_intent
    and c.created_at>clock_timestamp()-interval '60 seconds'
    and n.purpose='NORMAL' and n.revoked_at is null and n.expires_at>clock_timestamp()
    and n.idle_expires_at>clock_timestamp()
    and n.identity_generation=i.generation and i.lifecycle='ACTIVE' and i.onboarding='COMPLETE';
$$;
revoke all on function rmc_auth_api.replay_activation_completion(uuid,bytea,bytea,bytea)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.replay_activation_completion(uuid,bytea,bytea,bytea)
  to service_role;

create function rmc_auth_api.complete_activation(
  p_bootstrap_cookie bytea,p_bootstrap_csrf bytea,p_command uuid,p_intent bytea,
  p_provider uuid,p_factor uuid,p_assurance rmc_auth_private.assurance_level,
  p_provider_ciphertext bytea,p_provider_key integer,p_provider_expires timestamptz,
  p_normal_session uuid,p_normal_cookie bytea,p_normal_csrf bytea,
  p_normal_csrf_ciphertext bytea,p_normal_binding bytea,p_context_key integer,p_request uuid
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare identity_row rmc_auth_private.identities%rowtype;
  bootstrap rmc_auth_private.functional_sessions%rowtype;
  password_state rmc_auth_private.activation_password_state%rowtype;
  factor_state rmc_auth_private.activation_totp_state%rowtype;
  now_at timestamptz:=clock_timestamp(); absolute_expiry timestamptz;
  idle_expiry timestamptz; slot smallint; event_id uuid; new_generation bigint;
begin
  if octet_length(p_bootstrap_cookie) is distinct from 32
    or octet_length(p_bootstrap_csrf) is distinct from 32
    or octet_length(p_intent) is distinct from 32
    or octet_length(p_normal_cookie) is distinct from 32
    or octet_length(p_normal_csrf) is distinct from 32
    or octet_length(p_normal_csrf_ciphertext) is distinct from 60
    or octet_length(p_normal_binding) is distinct from 32
    or octet_length(p_provider_ciphertext) not between 100 and 8192
    or p_context_key is null or p_context_key<1 or p_provider_key is null or p_provider_key<1
    or p_provider_expires<=now_at+interval '5 minutes'
    or p_command is null or p_provider is null or p_normal_session is null or p_request is null
  then return null; end if;
  select * into bootstrap from rmc_auth_private.functional_sessions
    where cookie_hash=p_bootstrap_cookie;
  if bootstrap.id is null then return null; end if;
  -- F04 day-zero takes this advisory lock before touching identities.
  perform pg_advisory_xact_lock(73041001);
  select * into identity_row from rmc_auth_private.identities where id=bootstrap.identity_id for update;
  select * into bootstrap from rmc_auth_private.functional_sessions where id=bootstrap.id for update;
  select * into password_state from rmc_auth_private.activation_password_state
    where identity_id=identity_row.id for update;
  select * into factor_state from rmc_auth_private.activation_totp_state
    where identity_id=identity_row.id for update;
  if identity_row.id is null or identity_row.lifecycle<>'PENDING'
    or identity_row.onboarding<>'SECURITY_SETUP' or identity_row.provider_subject<>p_provider
    or bootstrap.purpose<>'BOOTSTRAP' or bootstrap.revoked_at is not null
    or bootstrap.expires_at<=now_at or bootstrap.idle_expires_at<=now_at
    or bootstrap.identity_generation<>identity_row.generation
    or not exists(select 1 from rmc_auth_private.activation_bootstrap b
      where b.identity_id=identity_row.id and b.session_id=bootstrap.id)
    or not exists(select 1 from rmc_auth_private.csrf_material c
      where c.session_id=bootstrap.id and c.generation=bootstrap.generation
        and c.token_hash=p_bootstrap_csrf and c.invalidated_at is null and c.expires_at>now_at)
    or password_state.identity_id is null or password_state.bootstrap_session_id<>bootstrap.id
    or password_state.state<>'PROVED'
    or not exists(select 1 from rmc_auth_private.provider_reservations r
      where r.identity_id=identity_row.id and r.identity_generation=identity_row.generation
        and r.provider_subject=p_provider and r.state='COMMITTED')
    or not exists(select 1 from rmc_auth_private.provisioning_phone_sources p
      where p.identity_id=identity_row.id and p.identity_generation=identity_row.generation)
    or (identity_row.role='S' and not exists(
      select 1 from rmc_auth_private.provider_reservations r
      join rmc_auth_private.day_zero_receipt d on d.command_id=r.command_id
      where r.identity_id=identity_row.id and d.state='COMPLETE'))
    or (identity_row.role in ('M','O') and not exists(
      select 1 from rmc_auth_private.assignments a
      join rmc_auth_private.units_state u on u.id=a.unit_id
      where a.identity_id=identity_row.id and a.valid_until is null and u.is_eligible))
  then return null; end if;
  if p_factor is null then
    if identity_row.role<>'O' or p_assurance<>'aal1'
      or factor_state.identity_id is not null then return null; end if;
  else
    if p_assurance<>'aal2' or factor_state.identity_id is null
      or factor_state.bootstrap_session_id<>bootstrap.id
      or factor_state.factor_id is distinct from p_factor
      or factor_state.state<>'ENROLLED' then return null; end if;
  end if;
  if identity_row.role='S' then
    select case when not exists(select 1 from rmc_auth_private.identities
      where role='S' and lifecycle='ACTIVE' and active_superadmin_slot=1) then 1
      when not exists(select 1 from rmc_auth_private.identities
      where role='S' and lifecycle='ACTIVE' and active_superadmin_slot=2) then 2
      else null end into slot;
    if slot is null then return null; end if;
  end if;
  absolute_expiry:=least(now_at+interval '12 hours',p_provider_expires);
  idle_expiry:=least(now_at+interval '30 minutes',absolute_expiry);
  new_generation:=identity_row.generation+1;
  update rmc_auth_private.identities set lifecycle='ACTIVE',onboarding='COMPLETE',
    generation=new_generation,context_version=context_version+1,
    active_superadmin_slot=slot,updated_at=now_at where id=identity_row.id;
  update rmc_auth_private.csrf_material set invalidated_at=now_at
    where session_id=bootstrap.id and invalidated_at is null;
  delete from rmc_auth_private.activation_bootstrap where identity_id=identity_row.id
    and session_id=bootstrap.id;
  if p_factor is not null then
    update rmc_auth_private.activation_totp_state set state='VERIFIED',verified_at=now_at
      where identity_id=identity_row.id;
  end if;
  update rmc_auth_private.activation_password_state set
    provider_access_ciphertext=p_provider_ciphertext,provider_key_version=p_provider_key,
    provider_access_expires_at=p_provider_expires where identity_id=identity_row.id;
  insert into rmc_auth_private.functional_sessions
    (id,identity_id,purpose,assurance,cookie_hash,key_version,generation,identity_generation,
      expires_at,idle_expires_at)
    values(p_normal_session,identity_row.id,'NORMAL',p_assurance,p_normal_cookie,p_context_key,
      1,new_generation,absolute_expiry,idle_expiry);
  insert into rmc_auth_private.csrf_material
    (session_id,generation,token_hash,ciphertext,binding_hash,key_version,expires_at)
    values(p_normal_session,1,p_normal_csrf,p_normal_csrf_ciphertext,
      p_normal_binding,p_context_key,idle_expiry);
  insert into rmc_auth_private.activation_completions
    (command_id,bootstrap_session_id,bootstrap_cookie_hash,bootstrap_csrf_hash,intent_hash,
      normal_session_id,context_key_version,factor_id)
    values(p_command,bootstrap.id,p_bootstrap_cookie,p_bootstrap_csrf,p_intent,
      p_normal_session,p_context_key,p_factor);
  insert into rmc_auth_private.audit_events
    (event_type,request_id,identity_id,purpose,generation,outcome,reason_code,contract_version,deployment_id)
    values('ADMIN_COMMAND_OUTCOME',p_request::text,identity_row.id,'NORMAL',1,
      'SUCCESS','ACTIVATION_COMPLETE','1.1','F06-local') returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  if p_factor is not null then
    insert into rmc_auth_private.audit_events
      (event_type,request_id,identity_id,purpose,generation,outcome,reason_code,contract_version,deployment_id)
      values('MFA_OUTCOME',p_request::text,identity_row.id,'NORMAL',1,
        'SUCCESS','TOTP_VERIFIED','1.1','F06-local') returning id into event_id;
    insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  end if;
  return jsonb_build_object('normalSessionId',p_normal_session,'expiresAt',absolute_expiry,
    'idleExpiresAt',idle_expiry,
    'contextKeyVersion',p_context_key,'role',identity_row.role,
    'contextVersion',identity_row.context_version+1);
end $$;
revoke all on function rmc_auth_api.complete_activation(bytea,bytea,uuid,bytea,uuid,uuid,
  rmc_auth_private.assurance_level,bytea,integer,timestamptz,uuid,bytea,bytea,bytea,bytea,integer,uuid)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.complete_activation(bytea,bytea,uuid,bytea,uuid,uuid,
  rmc_auth_private.assurance_level,bytea,integer,timestamptz,uuid,bytea,bytea,bytea,bytea,integer,uuid)
  to service_role;
grant delete on rmc_auth_private.activation_bootstrap to service_role;
grant update(lifecycle,generation,context_version,active_superadmin_slot)
  on rmc_auth_private.identities to service_role;
