alter table rmc_auth_private.audit_events drop constraint audit_reason_allowlist;
alter table rmc_auth_private.audit_events add constraint audit_reason_allowlist check (reason_code in (
  'VERIFIED','REVOKED','COMMITTED','ACCEPTED','DELIVERED','EXPIRED','STALE','RECONCILIATION_REQUIRED',
  'AUTH_INVALID_REQUEST','AUTH_SESSION_INVALID','AUTH_CREDENTIALS_INVALID','AUTH_ORIGIN_DENIED',
  'AUTH_CSRF_INVALID','AUTH_ACCESS_DENIED','AUTH_STEP_UP_REQUIRED','RESOURCE_NOT_FOUND',
  'AUTH_STATE_CONFLICT','AUTH_BODY_TOO_LARGE','AUTH_UNSUPPORTED_MEDIA_TYPE','AUTH_RATE_LIMITED',
  'AUTH_CONFIGURATION_ERROR','AUTH_UNEXPECTED_ERROR','AUTH_PROVIDER_FAILURE',
  'AUTH_DEPENDENCY_UNAVAILABLE','AUTH_DEPENDENCY_TIMEOUT','PROVISION_RESERVED','PROVISION_COMMITTED',
  'PROVIDER_OUTCOME_UNKNOWN','OWNERSHIP_CONFLICT','STALE_FENCE','RECONCILIATION_CONFIRMED',
  'DAY_ZERO_COMPLETE','PROVISION_COMPENSATION_FENCED','PROVISION_COMPENSATED','PASSWORD_PROVED'));
alter table rmc_auth_private.command_ledger drop constraint commands_result_sanitized;
alter table rmc_auth_private.command_ledger add constraint commands_result_sanitized check (
  result_payload is null or result_payload='{}'::jsonb or (
    command_type='PROVISION_IDENTITY' and state='COMMITTED' and target_identity_id is not null
    and result_payload=jsonb_build_object('identityId',target_identity_id)) or (
    command_type='ACTIVATION_PASSWORD' and state='COMMITTED' and target_identity_id is not null
    and result_payload='{"step":"SECURITY_SETUP"}'::jsonb));

create table rmc_auth_private.activation_password_state (
  identity_id uuid primary key references rmc_auth_private.identities(id),
  bootstrap_session_id uuid not null references rmc_auth_private.functional_sessions(id),
  command_id uuid not null unique,
  password_intent_hash bytea not null check(octet_length(password_intent_hash)=32),
  lease_owner uuid not null,
  fence bigint not null default 1 check(fence>0),
  lease_expires_at timestamptz not null,
  attempts integer not null default 1 check(attempts between 1 and 3),
  state text not null default 'CLAIMED' check(state in ('CLAIMED','PROVED')),
  provider_access_ciphertext bytea,
  provider_key_version integer check(provider_key_version>0),
  provider_access_expires_at timestamptz,
  proved_at timestamptz,
  check((state='PROVED')=(provider_access_ciphertext is not null
    and provider_key_version is not null and provider_access_expires_at is not null and proved_at is not null))
);
alter table rmc_auth_private.activation_password_state enable row level security;
alter table rmc_auth_private.activation_password_state force row level security;
revoke all on rmc_auth_private.activation_password_state from public,anon,authenticated;
grant select,insert on rmc_auth_private.activation_password_state to service_role;
grant update(lease_owner,fence,lease_expires_at,attempts,state,provider_access_ciphertext,
  provider_key_version,provider_access_expires_at,proved_at) on rmc_auth_private.activation_password_state to service_role;

create function rmc_auth_api.claim_activation_password(
  p_cookie bytea,p_csrf bytea,p_command uuid,p_intent bytea,p_owner uuid
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare session_row rmc_auth_private.functional_sessions%rowtype;
  identity_row rmc_auth_private.identities%rowtype;
  state_row rmc_auth_private.activation_password_state%rowtype;
  reservation rmc_auth_private.provider_reservations%rowtype;
  now_at timestamptz:=clock_timestamp();
begin
  if octet_length(p_cookie) is distinct from 32 or octet_length(p_csrf) is distinct from 32
    or octet_length(p_intent) is distinct from 32 or p_command is null or p_owner is null
  then return null; end if;
  select * into session_row from rmc_auth_private.functional_sessions where cookie_hash=p_cookie;
  if session_row.id is null then return null; end if;
  select * into identity_row from rmc_auth_private.identities where id=session_row.identity_id for update;
  select * into session_row from rmc_auth_private.functional_sessions where id=session_row.id for update;
  if identity_row.id is null or identity_row.lifecycle<>'PENDING'
    or identity_row.onboarding not in ('PASSWORD_REQUIRED','SECURITY_SETUP')
    or identity_row.generation<>session_row.identity_generation
    or session_row.purpose<>'BOOTSTRAP' or session_row.revoked_at is not null
    or session_row.expires_at<=now_at or session_row.idle_expires_at<=now_at
    or not exists(select 1 from rmc_auth_private.activation_bootstrap b
      where b.identity_id=identity_row.id and b.session_id=session_row.id)
    or not exists(select 1 from rmc_auth_private.csrf_material c
      where c.session_id=session_row.id and c.generation=session_row.generation
        and c.token_hash=p_csrf and c.invalidated_at is null and c.expires_at>now_at)
  then return null; end if;
  select * into reservation from rmc_auth_private.provider_reservations
    where identity_id=identity_row.id and provider_subject=identity_row.provider_subject
      and identity_generation=identity_row.generation and state='COMMITTED';
  if reservation.command_id is null then return null; end if;
  select * into state_row from rmc_auth_private.activation_password_state
    where identity_id=identity_row.id for update;
  if state_row.identity_id is null then
    if identity_row.onboarding<>'PASSWORD_REQUIRED' then return null; end if;
    insert into rmc_auth_private.command_ledger
      (command_id,idempotency_key,intent_hash,target_identity_id,command_type)
      values(p_command,p_command,p_intent,identity_row.id,'ACTIVATION_PASSWORD');
    update rmc_auth_private.command_ledger set state='EFFECT_REQUESTED',updated_at=now_at
      where command_id=p_command;
    insert into rmc_auth_private.activation_password_state
      (identity_id,bootstrap_session_id,command_id,password_intent_hash,lease_owner,lease_expires_at)
      values(identity_row.id,session_row.id,p_command,p_intent,p_owner,now_at+interval '15 seconds')
      returning * into state_row;
  elsif state_row.bootstrap_session_id<>session_row.id or state_row.command_id<>p_command
    or state_row.password_intent_hash<>p_intent then return null;
  elsif state_row.state='PROVED' then
    return jsonb_build_object('proved',true,'identityId',identity_row.id,'sessionId',session_row.id);
  elsif state_row.lease_expires_at>now_at then
    return '{"busy":true}'::jsonb;
  elsif state_row.attempts>=3 then return null;
  else
    update rmc_auth_private.activation_password_state set lease_owner=p_owner,
      fence=fence+1,attempts=attempts+1,lease_expires_at=now_at+interval '15 seconds'
      where identity_id=identity_row.id returning * into state_row;
  end if;
  return jsonb_build_object('claimed',true,'identityId',identity_row.id,
    'sessionId',session_row.id,'providerSubject',reservation.provider_subject,
    'reservationCommand',reservation.command_id,'ownershipBinding',reservation.ownership_binding,
    'generation',identity_row.generation,'fence',state_row.fence);
end $$;
revoke all on function rmc_auth_api.claim_activation_password(bytea,bytea,uuid,bytea,uuid)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.claim_activation_password(bytea,bytea,uuid,bytea,uuid)
  to service_role;

create function rmc_auth_api.prove_activation_password(
  p_identity uuid,p_session uuid,p_command uuid,p_owner uuid,p_fence bigint,
  p_provider uuid,p_ciphertext bytea,p_key_version integer,p_provider_expires timestamptz,
  p_request uuid
) returns boolean language plpgsql security invoker set search_path='' as $$
declare identity_row rmc_auth_private.identities%rowtype;
  session_row rmc_auth_private.functional_sessions%rowtype;
  state_row rmc_auth_private.activation_password_state%rowtype;
  event_id uuid; now_at timestamptz:=clock_timestamp();
begin
  if p_identity is null or p_session is null or p_command is null or p_owner is null or p_request is null
    or p_provider is null or p_fence is null or p_key_version is null or p_key_version<1
    or octet_length(p_ciphertext) not between 100 and 8192
    or p_provider_expires<=now_at+interval '5 minutes'
  then return false; end if;
  select * into identity_row from rmc_auth_private.identities where id=p_identity for update;
  select * into session_row from rmc_auth_private.functional_sessions where id=p_session for update;
  select * into state_row from rmc_auth_private.activation_password_state where identity_id=p_identity for update;
  if identity_row.id is null or identity_row.lifecycle<>'PENDING'
    or identity_row.onboarding<>'PASSWORD_REQUIRED' or identity_row.provider_subject<>p_provider
    or session_row.id is null or session_row.identity_id<>p_identity
    or session_row.purpose<>'BOOTSTRAP' or session_row.revoked_at is not null
    or session_row.expires_at<=now_at or session_row.idle_expires_at<=now_at
    or session_row.identity_generation<>identity_row.generation
    or not exists(select 1 from rmc_auth_private.activation_bootstrap b
      where b.identity_id=p_identity and b.session_id=p_session)
    or state_row.identity_id is null or state_row.bootstrap_session_id<>p_session
    or state_row.command_id<>p_command or state_row.lease_owner<>p_owner
    or state_row.fence<>p_fence or state_row.state<>'CLAIMED'
    or state_row.lease_expires_at<=now_at then return false; end if;
  update rmc_auth_private.activation_password_state set state='PROVED',
    provider_access_ciphertext=p_ciphertext,provider_key_version=p_key_version,
    provider_access_expires_at=p_provider_expires,proved_at=now_at
    where identity_id=p_identity;
  update rmc_auth_private.identities set onboarding='SECURITY_SETUP',updated_at=now_at
    where id=p_identity;
  update rmc_auth_private.command_ledger set state='EFFECT_CONFIRMED',updated_at=now_at
    where command_id=p_command and target_identity_id=p_identity
      and command_type='ACTIVATION_PASSWORD' and state='EFFECT_REQUESTED';
  update rmc_auth_private.command_ledger set state='COMMITTED',
    result_code='PASSWORD_PROVED',result_payload=jsonb_build_object('step','SECURITY_SETUP'),
    updated_at=now_at where command_id=p_command and target_identity_id=p_identity
      and command_type='ACTIVATION_PASSWORD';
  insert into rmc_auth_private.audit_events
    (event_type,request_id,command_id,identity_id,purpose,generation,outcome,reason_code,contract_version,deployment_id)
    values('ADMIN_COMMAND_OUTCOME',p_request::text,p_command,p_identity,'BOOTSTRAP',
      session_row.generation,'SUCCESS','PASSWORD_PROVED','1.1','F06-local')
    returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  return true;
end $$;
revoke all on function rmc_auth_api.prove_activation_password(uuid,uuid,uuid,uuid,bigint,uuid,bytea,integer,timestamptz,uuid)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.prove_activation_password(uuid,uuid,uuid,uuid,bigint,uuid,bytea,integer,timestamptz,uuid)
  to service_role;
