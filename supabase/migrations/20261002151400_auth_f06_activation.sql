-- F06 activation groundwork. These RPCs remain unreachable from HTTP until the
-- complete restricted journey, provider proof and promotion gates are wired.
alter table rmc_auth_private.challenges
  add column verifier_key_version integer check(verifier_key_version > 0);

create table rmc_auth_private.activation_requests (
  command_id uuid primary key check(command_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  preauth_id uuid not null,
  preauth_cookie_hash bytea not null check(octet_length(preauth_cookie_hash)=32),
  intent_hash bytea not null check(octet_length(intent_hash)=32),
  journey_id uuid not null unique references rmc_auth_private.journey_transactions(id),
  challenge_id uuid not null unique references rmc_auth_private.challenges(id),
  created_at timestamptz not null default clock_timestamp()
);
create index activation_requests_preauth_idx on rmc_auth_private.activation_requests(preauth_id);
alter table rmc_auth_private.activation_requests enable row level security;
alter table rmc_auth_private.activation_requests force row level security;
revoke all on rmc_auth_private.activation_requests from public,anon,authenticated;
grant select,insert,delete on rmc_auth_private.activation_requests to service_role;

-- F03 invokes this under the PREAUTH global lock. The activation ledger is
-- retained through the replay window, then released before deleting its parent.
create or replace function rmc_auth_api.cleanup_preauth_contexts()
returns integer language plpgsql security invoker set search_path='' as $$
declare removed integer;
begin
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
      order by j.expires_at limit 100);
  get diagnostics removed=row_count;
  delete from rmc_auth_private.rate_limit_buckets where (bucket_hash,purpose,window_started_at) in
    (select bucket_hash,purpose,window_started_at from rmc_auth_private.rate_limit_buckets
      where purpose in ('PREAUTH_GLOBAL','PREAUTH_IP') and expires_at<=clock_timestamp()
      order by expires_at limit 100);
  return removed;
end $$;

create table rmc_auth_private.activation_bootstrap (
  identity_id uuid primary key references rmc_auth_private.identities(id),
  session_id uuid not null unique references rmc_auth_private.functional_sessions(id),
  generation bigint not null default 1 check(generation>0),
  updated_at timestamptz not null default clock_timestamp()
);
alter table rmc_auth_private.activation_bootstrap enable row level security;
alter table rmc_auth_private.activation_bootstrap force row level security;
revoke all on rmc_auth_private.activation_bootstrap from public,anon,authenticated;
grant select,insert on rmc_auth_private.activation_bootstrap to service_role;
grant update(session_id,generation,updated_at) on rmc_auth_private.activation_bootstrap to service_role;
create function rmc_auth_private.guard_activation_bootstrap()
returns trigger language plpgsql security invoker set search_path='' as $$
declare current_session rmc_auth_private.functional_sessions%rowtype;
begin
  if tg_op='UPDATE' and (new.identity_id is distinct from old.identity_id
    or new.generation<>old.generation+1) then
    raise exception using errcode='23514',message='AUTH_BOOTSTRAP_POINTER_INVALID';
  end if;
  select * into current_session from rmc_auth_private.functional_sessions where id=new.session_id;
  if current_session.id is null or current_session.identity_id is distinct from new.identity_id
    or current_session.purpose<>'BOOTSTRAP' or current_session.revoked_at is not null
    or current_session.expires_at<=clock_timestamp() then
    raise exception using errcode='23514',message='AUTH_BOOTSTRAP_POINTER_INVALID';
  end if;
  return new;
end $$;
create trigger activation_bootstrap_guard before insert or update on rmc_auth_private.activation_bootstrap
  for each row execute function rmc_auth_private.guard_activation_bootstrap();
revoke all on function rmc_auth_private.guard_activation_bootstrap() from public,anon,authenticated;
grant execute on function rmc_auth_private.guard_activation_bootstrap() to service_role;

create table rmc_auth_private.activation_cooldowns (
  principal_hash bytea primary key check(octet_length(principal_hash)=32),
  requested_at timestamptz not null
);
alter table rmc_auth_private.activation_cooldowns enable row level security;
alter table rmc_auth_private.activation_cooldowns force row level security;
revoke all on rmc_auth_private.activation_cooldowns from public,anon,authenticated;
grant select,insert,update(requested_at),delete on rmc_auth_private.activation_cooldowns to service_role;

create function rmc_auth_api.activation_candidate(p_versions integer[],p_hashes bytea[])
returns jsonb language plpgsql security invoker set search_path='' as $$
declare candidates uuid[]; current_identity rmc_auth_private.identities%rowtype;
begin
  if p_versions is null or p_hashes is null or cardinality(p_versions) not between 1 and 8
    or cardinality(p_versions)<>cardinality(p_hashes)
    or exists(select 1 from unnest(p_versions,p_hashes) x(version,hash)
      where x.version is null or x.version<1 or octet_length(x.hash) is distinct from 32)
    or (select count(distinct version) from unnest(p_versions) version)<>cardinality(p_versions)
  then return null; end if;
  select array_agg(distinct l.identity_id) into candidates
    from rmc_auth_private.identity_lookups l
    join unnest(p_versions,p_hashes) x(version,hash)
      on l.key_version=x.version and l.lookup_hash=x.hash
    where l.lookup_type='CPF' and l.is_current;
  if cardinality(candidates) is distinct from 1 then return null; end if;
  select * into current_identity from rmc_auth_private.identities where id=candidates[1];
  if current_identity.id is null or current_identity.lifecycle<>'PENDING'
    or current_identity.onboarding<>'ACTIVATION_REQUIRED' or current_identity.provider_subject is null
    or not exists(select 1 from rmc_auth_private.provider_reservations r
      where r.identity_id=current_identity.id and r.identity_generation=current_identity.generation
        and r.provider_subject=current_identity.provider_subject and r.state='COMMITTED')
    or (current_identity.role='S' and not exists(
      select 1 from rmc_auth_private.provider_reservations r
      join rmc_auth_private.day_zero_receipt d on d.command_id=r.command_id
      where r.identity_id=current_identity.id and d.state='COMPLETE'))
    or not exists(select 1 from rmc_auth_private.provisioning_phone_sources p
      where p.identity_id=current_identity.id and p.identity_generation=current_identity.generation)
    or (current_identity.role in ('M','O') and not exists(
      select 1 from rmc_auth_private.assignments a
      join rmc_auth_private.units_state u on u.id=a.unit_id
      where a.identity_id=current_identity.id and a.valid_until is null and u.is_eligible))
  then return null; end if;
  return jsonb_build_object('identityId',current_identity.id,'generation',current_identity.generation);
end $$;
revoke all on function rmc_auth_api.activation_candidate(integer[],bytea[]) from public,anon,authenticated;
grant execute on function rmc_auth_api.activation_candidate(integer[],bytea[]) to service_role;

create function rmc_auth_api.replay_activation(
  p_command uuid,p_preauth_cookie bytea,p_preauth_csrf bytea,p_intent bytea
) returns jsonb language sql security invoker set search_path='' as $$
  select jsonb_build_object('journeyId',j.id,'challengeId',r.challenge_id,
    'expiresAt',c.expires_at,'contextKeyVersion',p.key_version)
  from rmc_auth_private.activation_requests r
  join rmc_auth_private.journey_transactions p on p.id=r.preauth_id
  join rmc_auth_private.csrf_material x on x.journey_id=p.id
  join rmc_auth_private.journey_transactions j on j.id=r.journey_id
  join rmc_auth_private.challenges c on c.id=r.challenge_id
  where r.command_id=p_command and r.preauth_cookie_hash=p_preauth_cookie
    and r.intent_hash=p_intent and p.secret_hash=p_preauth_cookie
    and x.token_hash=p_preauth_csrf and x.generation=p.generation and p.state='COMMITTED'
    and j.state='PENDING' and j.expires_at>clock_timestamp()
    and c.consumed_at is null and c.expires_at>clock_timestamp()
    and r.created_at>clock_timestamp()-interval '30 minutes';
$$;
revoke all on function rmc_auth_api.replay_activation(uuid,bytea,bytea,bytea)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.replay_activation(uuid,bytea,bytea,bytea)
  to service_role;

create function rmc_auth_api.begin_activation(
  p_command uuid,p_preauth uuid,p_preauth_cookie bytea,p_preauth_csrf bytea,p_intent bytea,p_ip_hash bytea,
  p_versions integer[],p_hashes bytea[],p_expected_identity uuid,p_expected_generation bigint,
  p_journey uuid,p_journey_cookie bytea,p_binding bytea,p_csrf_hash bytea,p_csrf_ciphertext bytea,
  p_context_key integer,p_challenge uuid,p_verifier bytea,p_verifier_key integer,
  p_ciphertext bytea,p_delivery_key integer,p_challenge_expires timestamptz,p_outbox uuid
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior rmc_auth_private.activation_requests%rowtype;
  parent rmc_auth_private.journey_transactions%rowtype;
  candidate jsonb; identity_id uuid; identity_generation bigint;
  now_at timestamptz; journey_expiry timestamptz; event_id uuid;
  window15 timestamptz; window_day timestamptz; global_hash bytea:=decode(repeat('00',32),'hex');
  global_count integer; ip_count integer; principal_count integer; daily_count integer; last_request timestamptz;
begin
  if p_command is null or p_preauth is null or p_journey is null or p_challenge is null or p_outbox is null
    or octet_length(p_preauth_cookie) is distinct from 32 or octet_length(p_preauth_csrf) is distinct from 32
    or octet_length(p_intent) is distinct from 32 or octet_length(p_ip_hash) is distinct from 32
    or octet_length(p_journey_cookie) is distinct from 32
    or octet_length(p_binding) is distinct from 32 or octet_length(p_csrf_hash) is distinct from 32
    or octet_length(p_csrf_ciphertext) is distinct from 60 or octet_length(p_verifier) is distinct from 32
    or octet_length(p_ciphertext)<29 or p_context_key is null or p_context_key<1
    or p_verifier_key is null or p_verifier_key<1 or p_delivery_key is null or p_delivery_key<1
  then raise exception using errcode='22023',message='AUTH_ACTIVATION_ARGUMENT_INVALID'; end if;

  select * into prior from rmc_auth_private.activation_requests where command_id=p_command;
  if prior.command_id is not null then
    if prior.preauth_id is distinct from p_preauth or prior.preauth_cookie_hash is distinct from p_preauth_cookie
      or prior.intent_hash is distinct from p_intent or prior.journey_id is distinct from p_journey
      or (select secret_hash from rmc_auth_private.journey_transactions where id=prior.journey_id)
        is distinct from p_journey_cookie
      or (select token_hash from rmc_auth_private.csrf_material where journey_id=prior.journey_id)
        is distinct from p_csrf_hash then
      raise exception using errcode='23505',message='AUTH_IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object('accepted',true,'challengeId',prior.challenge_id,
      'expiresAt',(select expires_at from rmc_auth_private.challenges where id=prior.challenge_id));
  end if;

  candidate:=rmc_auth_api.activation_candidate(p_versions,p_hashes);
  if candidate is not null and (candidate->>'identityId')::uuid is not distinct from p_expected_identity
    and (candidate->>'generation')::bigint is not distinct from p_expected_generation then
    identity_id:=(candidate->>'identityId')::uuid;
    identity_generation:=(candidate->>'generation')::bigint;
    perform id from rmc_auth_private.identities where id=identity_id for update;
    candidate:=rmc_auth_api.activation_candidate(p_versions,p_hashes);
    if candidate is null or (candidate->>'identityId')::uuid is distinct from identity_id
      or (candidate->>'generation')::bigint is distinct from identity_generation then
      identity_id:=null; identity_generation:=1;
    end if;
  else identity_id:=null; identity_generation:=1; end if;

  select * into parent from rmc_auth_private.journey_transactions where id=p_preauth for update;
  -- A concurrent request with the same command may have committed while this
  -- caller waited for the PREAUTH row lock. Re-read before state validation.
  select * into prior from rmc_auth_private.activation_requests where command_id=p_command;
  if prior.command_id is not null then
    if prior.preauth_id is distinct from p_preauth or prior.preauth_cookie_hash is distinct from p_preauth_cookie
      or prior.intent_hash is distinct from p_intent or prior.journey_id is distinct from p_journey
      or (select secret_hash from rmc_auth_private.journey_transactions where id=prior.journey_id)
        is distinct from p_journey_cookie
      or (select token_hash from rmc_auth_private.csrf_material where journey_id=prior.journey_id)
        is distinct from p_csrf_hash then
      raise exception using errcode='23505',message='AUTH_IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object('accepted',true,'challengeId',prior.challenge_id,
      'expiresAt',(select expires_at from rmc_auth_private.challenges where id=prior.challenge_id));
  end if;
  now_at:=clock_timestamp(); journey_expiry:=now_at+interval '30 minutes';
  if parent.id is null or parent.purpose<>'PREAUTH' or parent.identity_id is not null
    or parent.state<>'PENDING' or parent.consumed_at is not null
    or parent.secret_hash is distinct from p_preauth_cookie or parent.expires_at<=now_at
    or not exists(select 1 from rmc_auth_private.csrf_material c where c.journey_id=p_preauth
      and c.generation=parent.generation and c.token_hash=p_preauth_csrf
      and c.invalidated_at is null and c.expires_at>now_at)
    or p_challenge_expires<=now_at or p_challenge_expires>now_at+interval '10 minutes'
  then raise exception using errcode='22023',message='AUTH_ACTIVATION_CONTEXT_INVALID'; end if;

  window15:=to_timestamp(floor(extract(epoch from now_at)/900)*900);
  window_day:=date_trunc('day',now_at at time zone 'UTC') at time zone 'UTC';
  -- Global -> IP -> principal (15m -> day) lock order is fixed for concurrent requests.
  insert into rmc_auth_private.rate_limit_buckets
    (bucket_hash,purpose,window_started_at,window_seconds,consumed,limit_value,expires_at)
    values(global_hash,'ACTIVATION_GLOBAL',window15,900,0,300,window15+interval '30 minutes')
    on conflict do nothing;
  select consumed into global_count from rmc_auth_private.rate_limit_buckets
    where bucket_hash=global_hash and purpose='ACTIVATION_GLOBAL' and window_started_at=window15 for update;
  if global_count>=300 then return '{"limited":true}'::jsonb; end if;
  delete from rmc_auth_private.rate_limit_buckets where (bucket_hash,purpose,window_started_at) in
    (select bucket_hash,purpose,window_started_at from rmc_auth_private.rate_limit_buckets
      where purpose like 'ACTIVATION_%' and expires_at<=now_at order by expires_at limit 100);
  delete from rmc_auth_private.activation_cooldowns where principal_hash in
    (select principal_hash from rmc_auth_private.activation_cooldowns
      where requested_at<now_at-interval '1 day' order by requested_at limit 100);
  insert into rmc_auth_private.rate_limit_buckets
    (bucket_hash,purpose,window_started_at,window_seconds,consumed,limit_value,expires_at)
    values(p_ip_hash,'ACTIVATION_IP',window15,900,0,30,window15+interval '30 minutes')
    on conflict do nothing;
  select consumed into ip_count from rmc_auth_private.rate_limit_buckets
    where bucket_hash=p_ip_hash and purpose='ACTIVATION_IP' and window_started_at=window15 for update;
  if ip_count>=30 then return '{"limited":true}'::jsonb; end if;
  insert into rmc_auth_private.rate_limit_buckets
    (bucket_hash,purpose,window_started_at,window_seconds,consumed,limit_value,expires_at)
    values(p_intent,'ACTIVATION_PRINCIPAL',window15,900,0,3,window15+interval '30 minutes')
    on conflict do nothing;
  select consumed into principal_count from rmc_auth_private.rate_limit_buckets
    where bucket_hash=p_intent and purpose='ACTIVATION_PRINCIPAL' and window_started_at=window15 for update;
  if principal_count>=3 then return '{"limited":true}'::jsonb; end if;
  insert into rmc_auth_private.rate_limit_buckets
    (bucket_hash,purpose,window_started_at,window_seconds,consumed,limit_value,expires_at)
    values(p_intent,'ACTIVATION_DAILY',window_day,86400,0,10,window_day+interval '2 days')
    on conflict do nothing;
  select consumed into daily_count from rmc_auth_private.rate_limit_buckets
    where bucket_hash=p_intent and purpose='ACTIVATION_DAILY' and window_started_at=window_day for update;
  if daily_count>=10 then return '{"limited":true}'::jsonb; end if;
  insert into rmc_auth_private.activation_cooldowns(principal_hash,requested_at)
    values(p_intent,'-infinity') on conflict do nothing;
  select requested_at into last_request from rmc_auth_private.activation_cooldowns
    where principal_hash=p_intent for update;
  if last_request>now_at-interval '60 seconds' then return '{"limited":true}'::jsonb; end if;

  -- The child journey and its challenge/outbox are one PostgreSQL commit.
  insert into rmc_auth_private.journey_transactions
    (id,identity_id,purpose,binding_hash,identity_generation,secret_hash,key_version,state,expires_at)
    values(p_journey,identity_id,'PREAUTH',p_binding,identity_generation,p_journey_cookie,p_context_key,'PENDING',journey_expiry);
  insert into rmc_auth_private.csrf_material
    (journey_id,generation,token_hash,ciphertext,binding_hash,key_version,expires_at)
    values(p_journey,1,p_csrf_hash,p_csrf_ciphertext,p_binding,p_context_key,journey_expiry);
  insert into rmc_auth_private.challenges
    (id,journey_id,identity_id,purpose,verifier_hash,verifier_key_version,ciphertext,
      key_version,binding_hash,generation,max_attempts,expires_at)
    values(p_challenge,p_journey,identity_id,'PREAUTH',p_verifier,p_verifier_key,p_ciphertext,
      p_delivery_key,p_binding,1,5,p_challenge_expires);
  if identity_id is not null then
    insert into rmc_auth_private.delivery_outbox
      (id,challenge_id,identity_id,purpose,envelope_ciphertext,key_version,binding_hash,
        idempotency_key,generation,max_attempts)
      values(p_outbox,p_challenge,identity_id,'PREAUTH',p_ciphertext,p_delivery_key,p_binding,
        p_outbox,1,5);
  end if;
  update rmc_auth_private.journey_transactions set state='COMMITTED',consumed_at=now_at where id=p_preauth;
  update rmc_auth_private.csrf_material set invalidated_at=now_at where journey_id=p_preauth and invalidated_at is null;
  insert into rmc_auth_private.activation_requests
    (command_id,preauth_id,preauth_cookie_hash,intent_hash,journey_id,challenge_id)
    values(p_command,p_preauth,p_preauth_cookie,p_intent,p_journey,p_challenge);
  update rmc_auth_private.rate_limit_buckets set consumed=consumed+1
    where (bucket_hash=global_hash and purpose='ACTIVATION_GLOBAL' and window_started_at=window15)
      or (bucket_hash=p_ip_hash and purpose='ACTIVATION_IP' and window_started_at=window15)
      or (bucket_hash=p_intent and purpose='ACTIVATION_PRINCIPAL' and window_started_at=window15)
      or (bucket_hash=p_intent and purpose='ACTIVATION_DAILY' and window_started_at=window_day);
  update rmc_auth_private.activation_cooldowns set requested_at=now_at where principal_hash=p_intent;
  insert into rmc_auth_private.audit_events
    (event_type,request_id,identity_id,purpose,generation,outcome,reason_code,contract_version,deployment_id)
    values('CHALLENGE_REQUESTED',p_command::text,identity_id,'PREAUTH',1,'SUCCESS','ACCEPTED','1.1','F06-local')
    returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  return jsonb_build_object('accepted',true,'challengeId',p_challenge,'expiresAt',p_challenge_expires);
end $$;
revoke all on function rmc_auth_api.begin_activation(uuid,uuid,bytea,bytea,bytea,bytea,integer[],bytea[],uuid,bigint,
  uuid,bytea,bytea,bytea,bytea,integer,uuid,bytea,integer,bytea,integer,timestamptz,uuid)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.begin_activation(uuid,uuid,bytea,bytea,bytea,bytea,integer[],bytea[],uuid,bigint,
  uuid,bytea,bytea,bytea,bytea,integer,uuid,bytea,integer,bytea,integer,timestamptz,uuid)
  to service_role;
grant update(state,consumed_at) on rmc_auth_private.journey_transactions to service_role;

create function rmc_auth_private.equal_digest_32(p_left bytea,p_right bytea)
returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare difference integer:=0;
begin
  if octet_length(p_left) is distinct from 32 or octet_length(p_right) is distinct from 32 then return false; end if;
  for idx in 0..31 loop difference:=difference | (get_byte(p_left,idx) # get_byte(p_right,idx)); end loop;
  return difference=0;
end $$;
revoke all on function rmc_auth_private.equal_digest_32(bytea,bytea) from public,anon,authenticated;
grant execute on function rmc_auth_private.equal_digest_32(bytea,bytea) to service_role;

create function rmc_auth_api.read_activation_challenge(p_cookie bytea,p_csrf bytea,p_challenge uuid)
returns jsonb language sql security invoker set search_path='' as $$
  select jsonb_build_object('journeyId',j.id,'challengeId',c.id,'identityId',j.identity_id,
    'generation',j.generation,'expiresAt',to_char(c.expires_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'keyVersion',c.verifier_key_version)
  from rmc_auth_private.journey_transactions j
  join rmc_auth_private.csrf_material x on x.journey_id=j.id
  join rmc_auth_private.challenges c on c.journey_id=j.id
  where j.secret_hash=p_cookie and x.token_hash=p_csrf and c.id=p_challenge
    and j.purpose='PREAUTH' and j.state='PENDING' and j.consumed_at is null
    and x.generation=j.generation and x.invalidated_at is null and x.expires_at>clock_timestamp()
    and c.generation=j.generation and c.consumed_at is null
    and c.attempt_count<c.max_attempts and c.expires_at>clock_timestamp()
    and j.expires_at>clock_timestamp()
    and exists(select 1 from rmc_auth_private.activation_requests r where r.journey_id=j.id and r.challenge_id=c.id);
$$;
revoke all on function rmc_auth_api.read_activation_challenge(bytea,bytea,uuid) from public,anon,authenticated;
grant execute on function rmc_auth_api.read_activation_challenge(bytea,bytea,uuid) to service_role;

create function rmc_auth_api.verify_activation(
  p_cookie bytea,p_csrf bytea,p_challenge uuid,p_verifier bytea,
  p_bootstrap_session uuid,p_bootstrap_cookie bytea,p_bootstrap_csrf bytea,
  p_bootstrap_csrf_ciphertext bytea,p_bootstrap_binding bytea,p_context_key integer,p_request uuid
) returns boolean language plpgsql security invoker set search_path='' as $$
declare challenge rmc_auth_private.challenges%rowtype;
  journey rmc_auth_private.journey_transactions%rowtype;
  identity_row rmc_auth_private.identities%rowtype;
  now_at timestamptz; event_id uuid; verified boolean;
begin
  if octet_length(p_cookie) is distinct from 32 or octet_length(p_csrf) is distinct from 32
    or octet_length(p_verifier) is distinct from 32 or octet_length(p_bootstrap_cookie) is distinct from 32
    or octet_length(p_bootstrap_csrf) is distinct from 32
    or octet_length(p_bootstrap_csrf_ciphertext) is distinct from 60
    or octet_length(p_bootstrap_binding) is distinct from 32
    or p_context_key is null or p_context_key<1 or p_challenge is null
    or p_bootstrap_session is null or p_request is null then return false; end if;
  select * into challenge from rmc_auth_private.challenges where id=p_challenge;
  if challenge.id is null then return false; end if;
  if challenge.identity_id is not null then
    select * into identity_row from rmc_auth_private.identities where id=challenge.identity_id for update;
  end if;
  select * into journey from rmc_auth_private.journey_transactions where id=challenge.journey_id for update;
  select * into challenge from rmc_auth_private.challenges where id=p_challenge for update;
  now_at:=clock_timestamp();
  if journey.id is null or challenge.id is null or journey.secret_hash is distinct from p_cookie
    or journey.state<>'PENDING' or journey.purpose<>'PREAUTH' or journey.consumed_at is not null
    or journey.expires_at<=now_at or challenge.consumed_at is not null or challenge.expires_at<=now_at
    or challenge.generation<>journey.generation or challenge.attempt_count>=challenge.max_attempts
    or not exists(select 1 from rmc_auth_private.csrf_material x where x.journey_id=journey.id
      and x.generation=journey.generation and x.token_hash=p_csrf
      and x.invalidated_at is null and x.expires_at>now_at)
    or not exists(select 1 from rmc_auth_private.activation_requests r
      where r.journey_id=journey.id and r.challenge_id=challenge.id)
  then return false; end if;
  verified:=rmc_auth_private.equal_digest_32(challenge.verifier_hash,p_verifier);
  if not verified or journey.identity_id is null or identity_row.id is null
    or identity_row.lifecycle<>'PENDING' or identity_row.onboarding<>'ACTIVATION_REQUIRED'
    or identity_row.generation<>journey.identity_generation or challenge.identity_id is distinct from identity_row.id
    or not exists(select 1 from rmc_auth_private.provider_reservations r
      where r.identity_id=identity_row.id and r.identity_generation=identity_row.generation
        and r.provider_subject=identity_row.provider_subject and r.state='COMMITTED')
    or (identity_row.role='S' and not exists(
      select 1 from rmc_auth_private.provider_reservations r
      join rmc_auth_private.day_zero_receipt d on d.command_id=r.command_id
      where r.identity_id=identity_row.id and d.state='COMPLETE'))
    or not exists(select 1 from rmc_auth_private.provisioning_phone_sources p
      where p.identity_id=identity_row.id and p.identity_generation=identity_row.generation)
    or (identity_row.role in ('M','O') and not exists(
      select 1 from rmc_auth_private.assignments a
      join rmc_auth_private.units_state u on u.id=a.unit_id
      where a.identity_id=identity_row.id and a.valid_until is null and u.is_eligible)) then
    update rmc_auth_private.challenges set attempt_count=attempt_count+1 where id=challenge.id;
    return false;
  end if;
  update rmc_auth_private.challenges set consumed_at=now_at where id=challenge.id;
  update rmc_auth_private.journey_transactions set state='VERIFIED' where id=journey.id;
  update rmc_auth_private.csrf_material set invalidated_at=now_at
    where journey_id=journey.id and invalidated_at is null;
  update rmc_auth_private.identities set onboarding='PASSWORD_REQUIRED',updated_at=now_at
    where id=identity_row.id;
  insert into rmc_auth_private.functional_sessions
    (id,identity_id,purpose,assurance,cookie_hash,key_version,generation,identity_generation,expires_at,idle_expires_at)
    values(p_bootstrap_session,identity_row.id,'BOOTSTRAP','aal1',p_bootstrap_cookie,p_context_key,1,
      identity_row.generation,journey.expires_at,journey.expires_at);
  insert into rmc_auth_private.csrf_material
    (session_id,generation,token_hash,ciphertext,binding_hash,key_version,expires_at)
    values(p_bootstrap_session,1,p_bootstrap_csrf,p_bootstrap_csrf_ciphertext,
      p_bootstrap_binding,p_context_key,journey.expires_at);
  insert into rmc_auth_private.activation_bootstrap(identity_id,session_id)
    values(identity_row.id,p_bootstrap_session)
    on conflict(identity_id) do update set session_id=excluded.session_id,
      generation=rmc_auth_private.activation_bootstrap.generation+1,updated_at=now_at;
  insert into rmc_auth_private.audit_events
    (event_type,request_id,identity_id,purpose,generation,outcome,reason_code,contract_version,deployment_id)
    values('CHALLENGE_VERIFIED',p_request::text,identity_row.id,'BOOTSTRAP',1,'SUCCESS','VERIFIED','1.1','F06-local')
    returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  return true;
end $$;
revoke all on function rmc_auth_api.verify_activation(bytea,bytea,uuid,bytea,uuid,bytea,bytea,bytea,bytea,integer,uuid)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.verify_activation(bytea,bytea,uuid,bytea,uuid,bytea,bytea,bytea,bytea,integer,uuid)
  to service_role;
grant update(onboarding,updated_at) on rmc_auth_private.identities to service_role;
grant insert on rmc_auth_private.functional_sessions to service_role;
grant update(state,updated_at) on rmc_auth_private.journey_transactions to service_role;

create function rmc_auth_api.cancel_activation(p_cookie bytea,p_csrf bytea,p_request uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare journey rmc_auth_private.journey_transactions%rowtype;
  event_id uuid; now_at timestamptz:=clock_timestamp();
begin
  if octet_length(p_cookie) is distinct from 32 or octet_length(p_csrf) is distinct from 32
    or p_request is null then return false; end if;
  select * into journey from rmc_auth_private.journey_transactions
    where secret_hash=p_cookie and purpose='PREAUTH' for update;
  if journey.id is null or not exists(select 1 from rmc_auth_private.activation_requests a
      where a.journey_id=journey.id)
    or not exists(select 1 from rmc_auth_private.csrf_material c
      where c.journey_id=journey.id and c.token_hash=p_csrf)
  then return false; end if;
  if journey.state='CANCELLED' then return true; end if;
  if journey.state<>'PENDING' or journey.consumed_at is not null then return false; end if;
  update rmc_auth_private.journey_transactions set state='CANCELLED',updated_at=now_at
    where id=journey.id;
  update rmc_auth_private.csrf_material set invalidated_at=now_at
    where journey_id=journey.id and invalidated_at is null;
  insert into rmc_auth_private.audit_events
    (event_type,request_id,identity_id,purpose,generation,outcome,reason_code,contract_version,deployment_id)
    values('SESSION_REVOKED',p_request::text,journey.identity_id,'PREAUTH',journey.generation,
      'SUCCESS','REVOKED','1.1','F06-local') returning id into event_id;
  insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
  return true;
end $$;
revoke all on function rmc_auth_api.cancel_activation(bytea,bytea,uuid)
  from public,anon,authenticated;
grant execute on function rmc_auth_api.cancel_activation(bytea,bytea,uuid) to service_role;
