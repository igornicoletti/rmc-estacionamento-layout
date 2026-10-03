-- F06 journey read and resend. Every resend replaces the active challenge in
-- one transaction; prior attempts remain charged against the journey budget.
grant select(identity_id,unit_id,valid_until) on rmc_auth_private.assignments to service_role;
grant select(id,is_eligible) on rmc_auth_private.units_state to service_role;
alter table rmc_auth_private.activation_requests
  add column resend_count integer not null default 0 check(resend_count between 0 and 3),
  add column last_resend_at timestamptz;

create table rmc_auth_private.activation_resends (
  command_id uuid primary key,
  journey_id uuid not null references rmc_auth_private.journey_transactions(id),
  challenge_id uuid not null references rmc_auth_private.challenges(id),
  created_at timestamptz not null default clock_timestamp()
);
alter table rmc_auth_private.activation_resends enable row level security;
alter table rmc_auth_private.activation_resends force row level security;
revoke all on rmc_auth_private.activation_resends from public,anon,authenticated;
grant select,insert,delete on rmc_auth_private.activation_resends to service_role;

create function rmc_auth_api.read_activation_journey(p_cookie bytea,p_csrf bytea)
returns jsonb language sql security invoker set search_path='' as $$
  select jsonb_build_object('step','OTP_REQUIRED','challengeId',c.id,
    'journeyId',j.id,'identityId',j.identity_id,'generation',j.generation,
    'contextKeyVersion',j.key_version,
    'expiresAt',c.expires_at,'journeyExpiresAt',j.expires_at)
  from rmc_auth_private.journey_transactions j
  join rmc_auth_private.csrf_material x on x.journey_id=j.id
  join rmc_auth_private.activation_requests r on r.journey_id=j.id
  join rmc_auth_private.challenges c on c.id=r.challenge_id
  where j.secret_hash=p_cookie and x.token_hash=p_csrf
    and j.purpose='PREAUTH' and j.state='PENDING' and j.consumed_at is null
    and j.expires_at>clock_timestamp() and x.generation=j.generation
    and x.invalidated_at is null and x.expires_at>clock_timestamp()
    and c.consumed_at is null
    and (select coalesce(sum(attempt_count),0) from rmc_auth_private.challenges
      where journey_id=j.id)<5;
$$;
revoke all on function rmc_auth_api.read_activation_journey(bytea,bytea) from public,anon,authenticated;
grant execute on function rmc_auth_api.read_activation_journey(bytea,bytea) to service_role;

create function rmc_auth_api.resend_activation(
  p_cookie bytea,p_csrf bytea,p_command uuid,p_challenge uuid,p_verifier bytea,
  p_verifier_key integer,p_ciphertext bytea,p_delivery_key integer,
  p_expires timestamptz,p_outbox uuid
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare j rmc_auth_private.journey_transactions%rowtype;
  i rmc_auth_private.identities%rowtype;
  r rmc_auth_private.activation_requests%rowtype;
  c rmc_auth_private.challenges%rowtype;
  csrf_row rmc_auth_private.csrf_material%rowtype;
  prior rmc_auth_private.activation_resends%rowtype;
  now_at timestamptz; spent integer;
begin
  if p_command is null or p_challenge is null or p_outbox is null
    or octet_length(p_cookie) is distinct from 32 or octet_length(p_csrf) is distinct from 32
    or octet_length(p_verifier) is distinct from 32 or octet_length(p_ciphertext)<29
    or p_verifier_key is null or p_verifier_key<1 or p_delivery_key is null or p_delivery_key<1
  then return null; end if;
  select * into j from rmc_auth_private.journey_transactions
    where secret_hash=p_cookie and purpose='PREAUTH';
  if j.id is null then return null; end if;
  if j.identity_id is not null then
    select * into i from rmc_auth_private.identities where id=j.identity_id for update;
  end if;
  select * into j from rmc_auth_private.journey_transactions where id=j.id for update;
  select * into r from rmc_auth_private.activation_requests where journey_id=j.id for update;
  select * into c from rmc_auth_private.challenges where id=r.challenge_id for update;
  select * into prior from rmc_auth_private.activation_resends where command_id=p_command;
  now_at:=clock_timestamp();
  if prior.command_id is not null then
    if prior.journey_id<>j.id or prior.challenge_id<>r.challenge_id then return null; end if;
    return jsonb_build_object('accepted',true,'challengeId',c.id,'expiresAt',c.expires_at,
      'journeyExpiresAt',j.expires_at);
  end if;
  if r.command_id is null or j.state<>'PENDING' or j.consumed_at is not null
    or j.expires_at<=now_at or c.consumed_at is not null
    or not exists(select 1 from rmc_auth_private.csrf_material x where x.journey_id=j.id
      and x.generation=j.generation and x.token_hash=p_csrf
      and x.invalidated_at is null and x.expires_at>now_at)
    or r.resend_count>=3 or coalesce(r.last_resend_at,r.created_at)>now_at-interval '60 seconds'
    or p_expires<=now_at or p_expires>least(j.expires_at,now_at+interval '10 minutes')
  then return null; end if;
  select coalesce(sum(attempt_count),0) into spent from rmc_auth_private.challenges where journey_id=j.id;
  if spent>=5 then return null; end if;
  if j.identity_id is not null and (i.id is null or i.generation<>j.identity_generation
    or i.lifecycle<>'PENDING' or i.onboarding<>'ACTIVATION_REQUIRED'
    or not exists(select 1 from rmc_auth_private.provisioning_phone_sources p
      where p.identity_id=i.id and p.identity_generation=i.generation)) then return null; end if;
  update rmc_auth_private.challenges set consumed_at=now_at where id=c.id;
  select * into csrf_row from rmc_auth_private.csrf_material where journey_id=j.id;
  delete from rmc_auth_private.csrf_material where journey_id=j.id;
  update rmc_auth_private.journey_transactions set generation=generation+1,
    updated_at=now_at where id=j.id;
  insert into rmc_auth_private.csrf_material
    (journey_id,generation,token_hash,ciphertext,binding_hash,key_version,expires_at)
    values(j.id,j.generation+1,p_csrf,csrf_row.ciphertext,j.binding_hash,j.key_version,j.expires_at);
  insert into rmc_auth_private.challenges
    (id,journey_id,identity_id,purpose,verifier_hash,verifier_key_version,ciphertext,
     key_version,binding_hash,generation,max_attempts,expires_at)
    values(p_challenge,j.id,j.identity_id,'PREAUTH',p_verifier,p_verifier_key,p_ciphertext,
      p_delivery_key,j.binding_hash,j.generation+1,5-spent,p_expires);
  if j.identity_id is not null then
    insert into rmc_auth_private.delivery_outbox
      (id,challenge_id,identity_id,purpose,envelope_ciphertext,key_version,binding_hash,
       idempotency_key,generation,max_attempts)
      values(p_outbox,p_challenge,j.identity_id,'PREAUTH',p_ciphertext,p_delivery_key,
        j.binding_hash,p_outbox,j.generation+1,5);
  end if;
  update rmc_auth_private.activation_requests set challenge_id=p_challenge,
    resend_count=resend_count+1,last_resend_at=now_at where command_id=r.command_id;
  insert into rmc_auth_private.activation_resends(command_id,journey_id,challenge_id)
    values(p_command,j.id,p_challenge);
  return jsonb_build_object('accepted',true,'challengeId',p_challenge,'expiresAt',p_expires,
    'journeyExpiresAt',j.expires_at);
end $$;
revoke all on function rmc_auth_api.resend_activation(bytea,bytea,uuid,uuid,bytea,integer,bytea,integer,timestamptz,uuid)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.resend_activation(bytea,bytea,uuid,uuid,bytea,integer,bytea,integer,timestamptz,uuid)
  to service_role;
grant update(consumed_at) on rmc_auth_private.challenges to service_role;
grant update(challenge_id,resend_count,last_resend_at) on rmc_auth_private.activation_requests to service_role;
grant update(generation,updated_at) on rmc_auth_private.journey_transactions to service_role;

-- A phone source replacement invalidates codes already issued to the old
-- source, even when the identity generation itself has not changed.
alter table rmc_auth_private.provisioning_phone_sources
  add column source_revision bigint not null default 1 check(source_revision>0);
alter table rmc_auth_private.challenges
  add column phone_source_revision bigint check(phone_source_revision>0),
  add column phone_source_hash bytea check(phone_source_hash is null or octet_length(phone_source_hash)=32);

create function rmc_auth_private.bump_phone_source_revision()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.identity_id<>old.identity_id then
    raise exception using errcode='23514',message='PHONE_SOURCE_IDENTITY_IMMUTABLE';
  end if;
  perform 1 from rmc_auth_private.identities where id=new.identity_id for update;
  new.source_revision:=old.source_revision+1;
  return new;
end $$;
create trigger phone_source_revision_guard before update on rmc_auth_private.provisioning_phone_sources
  for each row execute function rmc_auth_private.bump_phone_source_revision();

create function rmc_auth_private.bind_challenge_phone_source()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.purpose='PREAUTH' and new.identity_id is not null
    and new.verifier_key_version is not null then
    select p.source_revision,
      extensions.digest(convert_to(jsonb_build_array(p.key_version,p.identity_generation)::text,'UTF8')
        || p.ciphertext,'sha256')
      into new.phone_source_revision,new.phone_source_hash
      from rmc_auth_private.provisioning_phone_sources p
      join rmc_auth_private.journey_transactions j on j.id=new.journey_id
      where p.identity_id=new.identity_id and p.identity_generation=j.identity_generation;
    if new.phone_source_revision is null then
      raise exception using errcode='23514',message='PHONE_SOURCE_MISSING';
    end if;
  end if;
  return new;
end $$;
create trigger activation_challenge_phone_binding before insert on rmc_auth_private.challenges
  for each row execute function rmc_auth_private.bind_challenge_phone_source();

create function rmc_auth_private.guard_challenge_phone_binding()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.phone_source_revision is distinct from old.phone_source_revision
    or new.phone_source_hash is distinct from old.phone_source_hash then
    raise exception using errcode='23514',message='PHONE_BINDING_IMMUTABLE';
  end if;
  return new;
end $$;
create trigger activation_challenge_phone_immutable before update on rmc_auth_private.challenges
  for each row execute function rmc_auth_private.guard_challenge_phone_binding();

create function rmc_auth_private.guard_activation_phone_source()
returns trigger language plpgsql security invoker set search_path='' as $$
declare bound_revision bigint; current_revision bigint;
  bound_hash bytea; current_hash bytea;
begin
  if tg_table_name='delivery_processing' then
    if new.state<>'REQUESTED' or old.state='REQUESTED' then return new; end if;
    select c.phone_source_revision,p.source_revision,c.phone_source_hash,
      extensions.digest(convert_to(jsonb_build_array(p.key_version,p.identity_generation)::text,'UTF8')
        || p.ciphertext,'sha256')
      into bound_revision,current_revision,bound_hash,current_hash
      from rmc_auth_private.delivery_outbox o
      join rmc_auth_private.challenges c on c.id=o.challenge_id
      left join rmc_auth_private.provisioning_phone_sources p on p.identity_id=o.identity_id
      where o.id=new.outbox_id and o.purpose='PREAUTH';
    if not found or bound_revision is null then return new; end if;
  elsif tg_table_name='challenges' then
    if new.purpose<>'PREAUTH' or new.identity_id is null
      or new.consumed_at is null or old.consumed_at is not null then return new; end if;
    if new.phone_source_revision is null then return new; end if;
    bound_revision:=new.phone_source_revision;
    bound_hash:=new.phone_source_hash;
    select p.source_revision,
      extensions.digest(convert_to(jsonb_build_array(p.key_version,p.identity_generation)::text,'UTF8')
        || p.ciphertext,'sha256')
      into current_revision,current_hash from rmc_auth_private.provisioning_phone_sources p
      where identity_id=new.identity_id;
  else
    if new.lifecycle<>'ACTIVE' or old.lifecycle='ACTIVE'
      or old.onboarding<>'SECURITY_SETUP' then return new; end if;
    select c.phone_source_revision,p.source_revision,c.phone_source_hash,
      extensions.digest(convert_to(jsonb_build_array(p.key_version,p.identity_generation)::text,'UTF8')
        || p.ciphertext,'sha256')
      into bound_revision,current_revision,bound_hash,current_hash
      from rmc_auth_private.activation_requests r
      join rmc_auth_private.journey_transactions j on j.id=r.journey_id
      join rmc_auth_private.challenges c on c.id=r.challenge_id
      left join rmc_auth_private.provisioning_phone_sources p on p.identity_id=new.id
      where j.identity_id=new.id and j.state='VERIFIED'
      order by r.created_at desc limit 1;
    if not found then raise exception using errcode='23514',message='PHONE_PROOF_MISSING'; end if;
  end if;
  if bound_revision is null or current_revision is distinct from bound_revision
    or bound_hash is null or current_hash is distinct from bound_hash then
    raise exception using errcode='23514',message='PHONE_SOURCE_CHANGED';
  end if;
  return new;
end $$;
create trigger activation_delivery_phone_guard before update of state on rmc_auth_private.delivery_processing
  for each row execute function rmc_auth_private.guard_activation_phone_source();
create trigger activation_verify_phone_guard before update of consumed_at on rmc_auth_private.challenges
  for each row execute function rmc_auth_private.guard_activation_phone_source();
create trigger activation_complete_phone_guard before update of lifecycle on rmc_auth_private.identities
  for each row execute function rmc_auth_private.guard_activation_phone_source();
revoke all on function rmc_auth_private.bump_phone_source_revision(),
  rmc_auth_private.bind_challenge_phone_source(),rmc_auth_private.guard_challenge_phone_binding(),
  rmc_auth_private.guard_activation_phone_source()
  from public,anon,authenticated;
grant execute on function rmc_auth_private.bump_phone_source_revision(),
  rmc_auth_private.bind_challenge_phone_source(),rmc_auth_private.guard_challenge_phone_binding(),
  rmc_auth_private.guard_activation_phone_source()
  to service_role;

-- The proof and replay receipt commit with the BOOTSTRAP session. A lost HTTP
-- response can reissue only the same cookie/CSRF for the same proof for 60 s.
create table rmc_auth_private.activation_verifications (
  command_id uuid primary key,
  journey_id uuid not null unique references rmc_auth_private.journey_transactions(id),
  challenge_id uuid not null unique references rmc_auth_private.challenges(id),
  journey_cookie_hash bytea not null check(octet_length(journey_cookie_hash)=32),
  journey_csrf_hash bytea not null check(octet_length(journey_csrf_hash)=32),
  intent_hash bytea not null check(octet_length(intent_hash)=32),
  bootstrap_session_id uuid not null unique references rmc_auth_private.functional_sessions(id),
  context_key_version integer not null check(context_key_version>0),
  created_at timestamptz not null default clock_timestamp()
);
alter table rmc_auth_private.activation_verifications enable row level security;
alter table rmc_auth_private.activation_verifications force row level security;
revoke all on rmc_auth_private.activation_verifications from public,anon,authenticated;
grant select,insert,delete on rmc_auth_private.activation_verifications to service_role;

create function rmc_auth_api.replay_activation_verify(
  p_cookie bytea,p_csrf bytea,p_command uuid,p_challenge uuid,p_intent bytea
) returns jsonb language sql security invoker set search_path='' as $$
  select jsonb_build_object('sessionId',s.id,'expiresAt',s.expires_at,
    'contextKeyVersion',v.context_key_version)
  from rmc_auth_private.activation_verifications v
  join rmc_auth_private.functional_sessions s on s.id=v.bootstrap_session_id
  join rmc_auth_private.identities i on i.id=s.identity_id
  where v.command_id=p_command and v.challenge_id=p_challenge
    and v.journey_cookie_hash=p_cookie and v.journey_csrf_hash=p_csrf
    and v.intent_hash=p_intent and v.created_at>clock_timestamp()-interval '60 seconds'
    and s.purpose='BOOTSTRAP' and s.revoked_at is null and s.expires_at>clock_timestamp()
    and s.identity_generation=i.generation and i.lifecycle='PENDING';
$$;
revoke all on function rmc_auth_api.replay_activation_verify(bytea,bytea,uuid,uuid,bytea)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.replay_activation_verify(bytea,bytea,uuid,uuid,bytea)
  to service_role;

create function rmc_auth_api.verify_activation_once(
  p_cookie bytea,p_csrf bytea,p_challenge uuid,p_verifier bytea,
  p_bootstrap_session uuid,p_bootstrap_cookie bytea,p_bootstrap_csrf bytea,
  p_bootstrap_csrf_ciphertext bytea,p_bootstrap_binding bytea,p_context_key integer,
  p_request uuid,p_command uuid,p_intent bytea
) returns boolean language plpgsql security invoker set search_path='' as $$
declare journey_id uuid;
begin
  if p_command is null or p_command<>p_bootstrap_session
    or octet_length(p_intent) is distinct from 32
    or exists(select 1 from rmc_auth_private.activation_verifications
      where command_id=p_command or challenge_id=p_challenge)
  then return false; end if;
  select c.journey_id into journey_id from rmc_auth_private.challenges c where c.id=p_challenge;
  if journey_id is null or not rmc_auth_api.verify_activation(
    p_cookie,p_csrf,p_challenge,p_verifier,p_bootstrap_session,p_bootstrap_cookie,
    p_bootstrap_csrf,p_bootstrap_csrf_ciphertext,p_bootstrap_binding,p_context_key,p_request)
  then return false; end if;
  insert into rmc_auth_private.activation_verifications
    (command_id,journey_id,challenge_id,journey_cookie_hash,journey_csrf_hash,
      intent_hash,bootstrap_session_id,context_key_version)
    values(p_command,journey_id,p_challenge,p_cookie,p_csrf,p_intent,p_bootstrap_session,p_context_key);
  return true;
end $$;
revoke all on function rmc_auth_api.verify_activation_once(bytea,bytea,uuid,bytea,uuid,bytea,bytea,bytea,bytea,integer,uuid,uuid,bytea)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.verify_activation_once(bytea,bytea,uuid,bytea,uuid,bytea,bytea,bytea,bytea,integer,uuid,uuid,bytea)
  to service_role;

create function rmc_auth_api.read_activation_bootstrap_status(p_cookie bytea,p_csrf bytea)
returns jsonb language sql security invoker set search_path='' as $$
  select jsonb_build_object('step',i.onboarding)
  from rmc_auth_private.functional_sessions s
  join rmc_auth_private.identities i on i.id=s.identity_id
  join rmc_auth_private.activation_bootstrap b on b.identity_id=i.id and b.session_id=s.id
  join rmc_auth_private.csrf_material x on x.session_id=s.id
  where s.cookie_hash=p_cookie and x.token_hash=p_csrf
    and s.purpose='BOOTSTRAP' and s.revoked_at is null
    and s.expires_at>clock_timestamp() and s.idle_expires_at>clock_timestamp()
    and s.identity_generation=i.generation and i.lifecycle='PENDING'
    and i.onboarding in ('PASSWORD_REQUIRED','SECURITY_SETUP')
    and x.generation=s.generation and x.invalidated_at is null
    and x.expires_at>clock_timestamp();
$$;
revoke all on function rmc_auth_api.read_activation_bootstrap_status(bytea,bytea)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.read_activation_bootstrap_status(bytea,bytea)
  to service_role;

-- A recovery lease fences promotion before the external unverified factor is
-- removed. Verified or foreign factors are never eligible for automatic reset.
alter table rmc_auth_private.activation_totp_state drop constraint activation_totp_state_state_check;
alter table rmc_auth_private.activation_totp_state add constraint activation_totp_state_state_check
  check((state='CLAIMED' and factor_id is null)
    or (state in ('ENROLLED','VERIFIED') and factor_id is not null)
    or state='RECOVERING');
alter table rmc_auth_private.activation_totp_state
  add column recovery_command uuid;
alter table rmc_auth_private.activation_totp_state drop constraint activation_totp_state_check;
grant update(command_id,recovery_command) on rmc_auth_private.activation_totp_state to service_role;

create function rmc_auth_api.claim_activation_totp_recovery(
  p_cookie bytea,p_csrf bytea,p_command uuid,p_owner uuid
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s rmc_auth_private.functional_sessions%rowtype;
  i rmc_auth_private.identities%rowtype;
  t rmc_auth_private.activation_totp_state%rowtype;
  now_at timestamptz:=clock_timestamp();
begin
  if octet_length(p_cookie) is distinct from 32 or octet_length(p_csrf) is distinct from 32
    or p_command is null or p_owner is null then return null; end if;
  select * into s from rmc_auth_private.functional_sessions where cookie_hash=p_cookie;
  if s.id is null then return null; end if;
  select * into i from rmc_auth_private.identities where id=s.identity_id for update;
  select * into s from rmc_auth_private.functional_sessions where id=s.id for update;
  select * into t from rmc_auth_private.activation_totp_state where identity_id=i.id for update;
  if i.id is null or i.lifecycle<>'PENDING' or i.onboarding<>'SECURITY_SETUP'
    or s.purpose<>'BOOTSTRAP' or s.revoked_at is not null or s.expires_at<=now_at
    or s.identity_generation<>i.generation or t.identity_id is null
    or t.bootstrap_session_id<>s.id
    or t.attempts>=3 or t.state='VERIFIED'
    or not exists(select 1 from rmc_auth_private.activation_bootstrap b
      where b.identity_id=i.id and b.session_id=s.id)
    or not exists(select 1 from rmc_auth_private.csrf_material c
      where c.session_id=s.id and c.generation=s.generation and c.token_hash=p_csrf
        and c.invalidated_at is null and c.expires_at>now_at)
    or not exists(select 1 from rmc_auth_private.activation_password_state p
      where p.identity_id=i.id and p.bootstrap_session_id=s.id and p.state='PROVED'
        and p.provider_access_expires_at>now_at+interval '5 minutes')
  then return null; end if;
  if t.state='RECOVERING' then
    if t.recovery_command<>p_command then return null; end if;
    if t.lease_expires_at>now_at then return '{"busy":true}'::jsonb; end if;
  elsif t.state='CLAIMED' and t.lease_expires_at>now_at then
    return '{"busy":true}'::jsonb;
  end if;
  update rmc_auth_private.activation_totp_state
    set state='RECOVERING',recovery_command=p_command,lease_owner=p_owner,
      fence=fence+1,lease_expires_at=now_at+interval '30 seconds'
    where identity_id=i.id returning * into t;
  return jsonb_build_object('claimed',true,'identityId',i.id,'sessionId',s.id,
    'generation',i.generation,'previousCommand',t.command_id,'factorId',t.factor_id,
    'fence',t.fence);
end $$;
revoke all on function rmc_auth_api.claim_activation_totp_recovery(bytea,bytea,uuid,uuid)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.claim_activation_totp_recovery(bytea,bytea,uuid,uuid)
  to service_role;

create function rmc_auth_api.finish_activation_totp_recovery(
  p_identity uuid,p_session uuid,p_command uuid,p_owner uuid,p_fence bigint
) returns boolean language plpgsql security invoker set search_path='' as $$
declare i rmc_auth_private.identities%rowtype;
  s rmc_auth_private.functional_sessions%rowtype;
  t rmc_auth_private.activation_totp_state%rowtype;
begin
  select * into i from rmc_auth_private.identities where id=p_identity for update;
  select * into s from rmc_auth_private.functional_sessions where id=p_session for update;
  select * into t from rmc_auth_private.activation_totp_state where identity_id=p_identity for update;
  if i.id is null or i.lifecycle<>'PENDING' or i.onboarding<>'SECURITY_SETUP'
    or s.id is null or s.identity_id<>i.id or s.purpose<>'BOOTSTRAP'
    or s.revoked_at is not null or s.expires_at<=clock_timestamp()
    or s.identity_generation<>i.generation or t.bootstrap_session_id<>s.id
    or t.state<>'RECOVERING' or t.recovery_command<>p_command
    or t.lease_owner<>p_owner or t.fence<>p_fence
    or t.lease_expires_at<=clock_timestamp() then return false; end if;
  update rmc_auth_private.activation_totp_state
    set state='CLAIMED',command_id=p_command,recovery_command=null,
      factor_id=null,lease_expires_at=clock_timestamp()
    where identity_id=i.id;
  return true;
end $$;
revoke all on function rmc_auth_api.finish_activation_totp_recovery(uuid,uuid,uuid,uuid,bigint)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.finish_activation_totp_recovery(uuid,uuid,uuid,uuid,bigint)
  to service_role;

create or replace function rmc_auth_api.cleanup_preauth_contexts()
returns integer language plpgsql security invoker set search_path='' as $$
declare removed integer;
begin
  delete from rmc_auth_private.activation_verifications where command_id in
    (select command_id from rmc_auth_private.activation_verifications
      where created_at<clock_timestamp()-interval '2 days'
      order by created_at limit 100);
  delete from rmc_auth_private.activation_resends where command_id in
    (select command_id from rmc_auth_private.activation_resends
      where created_at<clock_timestamp()-interval '2 days'
      order by created_at limit 100);
  delete from rmc_auth_private.activation_requests where command_id in
    (select command_id from rmc_auth_private.activation_requests
      where created_at<clock_timestamp()-interval '2 days'
      order by created_at limit 100);
  delete from rmc_auth_private.csrf_material where journey_id in
    (select c.journey_id from rmc_auth_private.csrf_material c
      join rmc_auth_private.journey_transactions j on j.id=c.journey_id
      where j.purpose='PREAUTH' and c.expires_at<=clock_timestamp()
      order by c.expires_at limit 100);
  delete from rmc_auth_private.journey_transactions where id in
    (select j.id from rmc_auth_private.journey_transactions j
      where j.purpose='PREAUTH' and j.expires_at<=clock_timestamp()
        and not exists(select 1 from rmc_auth_private.csrf_material c where c.journey_id=j.id)
        and not exists(select 1 from rmc_auth_private.challenges c where c.journey_id=j.id)
        and not exists(select 1 from rmc_auth_private.activation_requests a
          where a.preauth_id=j.id or a.journey_id=j.id)
        and not exists(select 1 from rmc_auth_private.activation_resends r where r.journey_id=j.id)
        and not exists(select 1 from rmc_auth_private.activation_verifications v where v.journey_id=j.id)
      order by j.expires_at limit 100);
  get diagnostics removed=row_count;
  delete from rmc_auth_private.rate_limit_buckets where (bucket_hash,purpose,window_started_at) in
    (select bucket_hash,purpose,window_started_at from rmc_auth_private.rate_limit_buckets
      where purpose in ('PREAUTH_GLOBAL','PREAUTH_IP') and expires_at<=clock_timestamp()
      order by expires_at limit 100);
  return removed;
end $$;
