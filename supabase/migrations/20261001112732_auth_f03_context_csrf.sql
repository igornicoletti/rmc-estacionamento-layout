-- F03: local PREAUTH and synchronizer material. No authenticated journey is created.
create table rmc_auth_private.csrf_material (
  journey_id uuid unique references rmc_auth_private.journey_transactions(id),
  session_id uuid unique references rmc_auth_private.functional_sessions(id),
  generation bigint not null check (generation > 0),
  token_hash bytea not null check (octet_length(token_hash)=32),
  ciphertext bytea not null check (octet_length(ciphertext)=60),
  binding_hash bytea not null check (octet_length(binding_hash)=32),
  key_version integer not null check (key_version > 0),
  purpose text not null default 'CSRF' check (purpose='CSRF'),
  expires_at timestamptz not null,
  invalidated_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  check (num_nonnulls(journey_id,session_id)=1),
  check (expires_at > created_at),
  check (journey_id is null or journey_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  check (session_id is null or session_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
);
create index csrf_expiry_idx on rmc_auth_private.csrf_material(expires_at);
create index csrf_session_fk_idx on rmc_auth_private.csrf_material(session_id);
alter table rmc_auth_private.csrf_material enable row level security;
alter table rmc_auth_private.csrf_material force row level security;
revoke all on rmc_auth_private.csrf_material from public,anon,authenticated;

create function rmc_auth_private.guard_csrf_material()
returns trigger language plpgsql security invoker set search_path=''
as $function$
declare
  authority_generation bigint;
  authority_expiry timestamptz;
  authority_binding bytea;
begin
  if tg_op='UPDATE' and (
    new.journey_id is distinct from old.journey_id or new.session_id is distinct from old.session_id
    or new.generation is distinct from old.generation or new.token_hash is distinct from old.token_hash
    or new.ciphertext is distinct from old.ciphertext or new.key_version is distinct from old.key_version
    or new.binding_hash is distinct from old.binding_hash or new.expires_at is distinct from old.expires_at
    or new.created_at is distinct from old.created_at or new.purpose is distinct from old.purpose
    or (old.invalidated_at is not null and new.invalidated_at is distinct from old.invalidated_at)
  ) then raise exception using errcode='23514',message='AUTH_CSRF_IMMUTABLE'; end if;
  if new.journey_id is not null then
    select generation,expires_at,binding_hash into authority_generation,authority_expiry,authority_binding
      from rmc_auth_private.journey_transactions where id=new.journey_id for key share;
  else
    select generation,least(expires_at,idle_expires_at) into authority_generation,authority_expiry
      from rmc_auth_private.functional_sessions where id=new.session_id for key share;
  end if;
  if authority_generation is null or new.generation <> authority_generation
    or new.expires_at > authority_expiry
    or (new.journey_id is not null and new.binding_hash is distinct from authority_binding) then
    raise exception using errcode='23514',message='AUTH_CSRF_BINDING_INVALID';
  end if;
  return new;
end
$function$;
create trigger csrf_authority_guard before insert or update on rmc_auth_private.csrf_material
for each row execute function rmc_auth_private.guard_csrf_material();

create function rmc_auth_api.read_preauth_context(p_cookie_hash bytea)
returns jsonb language sql security invoker set search_path=''
as $function$
  select jsonb_build_object(
    'contextId',j.id,'purpose',j.purpose,'generation',j.generation,
    'expiresAt',j.expires_at,'serverTime',clock_timestamp(),
    'csrfHash',encode(c.token_hash,'hex'),'ciphertext',encode(c.ciphertext,'hex'),
    'bindingHash',encode(c.binding_hash,'hex'),'keyVersion',c.key_version)
  from rmc_auth_private.journey_transactions j
  join rmc_auth_private.csrf_material c on c.journey_id=j.id
  where j.secret_hash=p_cookie_hash and j.purpose='PREAUTH' and j.identity_id is null
    and j.state='PENDING' and j.consumed_at is null and j.expires_at > clock_timestamp()
    and c.generation=j.generation and c.expires_at > clock_timestamp() and c.invalidated_at is null;
$function$;

create function rmc_auth_api.create_preauth_context(
  p_context_id uuid,p_cookie_hash bytea,p_csrf_hash bytea,p_ciphertext bytea,
  p_binding_hash bytea,p_key_version integer,p_ip_hash bytea)
returns jsonb language plpgsql security invoker set search_path=''
as $function$
declare
  context_now timestamptz := clock_timestamp();
  current_window timestamptz := date_trunc('minute',context_now);
  global_hash bytea := decode(repeat('00',32),'hex');
  global_count integer;
  ip_count integer;
begin
  if p_context_id is null or octet_length(p_cookie_hash) is distinct from 32
    or octet_length(p_csrf_hash) is distinct from 32 or octet_length(p_ciphertext) is distinct from 60
    or octet_length(p_binding_hash) is distinct from 32 or p_key_version is null or p_key_version < 1
    or octet_length(p_ip_hash) is distinct from 32 then
    raise exception using errcode='22023',message='AUTH_INVALID_REQUEST';
  end if;
  -- Global row always locks first: bounded key growth and consistent lock order.
  insert into rmc_auth_private.rate_limit_buckets
    (bucket_hash,purpose,window_started_at,window_seconds,consumed,limit_value,expires_at)
    values(global_hash,'PREAUTH_GLOBAL',current_window,60,0,600,current_window+interval '2 minutes')
    on conflict do nothing;
  select consumed into global_count from rmc_auth_private.rate_limit_buckets
    where bucket_hash=global_hash and purpose='PREAUTH_GLOBAL' and window_started_at=current_window for update;
  if global_count >= 600 then return jsonb_build_object('limited',true); end if;
  -- Bound retention during active local bootstrap without a hosted scheduler.
  -- Global lock serializes cleanup and creation; expired rows are processed in batches.
  perform rmc_auth_api.cleanup_preauth_contexts();
  insert into rmc_auth_private.rate_limit_buckets
    (bucket_hash,purpose,window_started_at,window_seconds,consumed,limit_value,expires_at)
    values(p_ip_hash,'PREAUTH_IP',current_window,60,0,60,current_window+interval '2 minutes')
    on conflict do nothing;
  select consumed into ip_count from rmc_auth_private.rate_limit_buckets
    where bucket_hash=p_ip_hash and purpose='PREAUTH_IP' and window_started_at=current_window for update;
  if ip_count >= 60 then return jsonb_build_object('limited',true); end if;
  update rmc_auth_private.rate_limit_buckets set consumed=consumed+1
    where window_started_at=current_window and ((bucket_hash=global_hash and purpose='PREAUTH_GLOBAL')
      or (bucket_hash=p_ip_hash and purpose='PREAUTH_IP'));
  insert into rmc_auth_private.journey_transactions
    (id,purpose,binding_hash,state,expires_at,secret_hash,key_version)
    values(p_context_id,'PREAUTH',p_binding_hash,'PENDING',context_now+interval '30 minutes',p_cookie_hash,p_key_version);
  insert into rmc_auth_private.csrf_material
    (journey_id,generation,token_hash,ciphertext,binding_hash,key_version,expires_at)
    values(p_context_id,1,p_csrf_hash,p_ciphertext,p_binding_hash,p_key_version,context_now+interval '30 minutes');
  return rmc_auth_api.read_preauth_context(p_cookie_hash);
end
$function$;

create function rmc_auth_api.validate_preauth_csrf(p_context_id uuid,p_generation bigint,p_csrf_hash bytea)
returns boolean language sql security invoker set search_path=''
as $function$
  select exists(select 1 from rmc_auth_private.journey_transactions j
    join rmc_auth_private.csrf_material c on c.journey_id=j.id
    where j.id=p_context_id and j.purpose='PREAUTH' and j.identity_id is null
      and j.state='PENDING' and j.consumed_at is null and j.generation=p_generation
      and c.generation=j.generation and c.token_hash=p_csrf_hash and c.invalidated_at is null
      and j.expires_at > clock_timestamp() and c.expires_at > clock_timestamp());
$function$;
create function rmc_auth_api.invalidate_preauth_csrf(p_context_id uuid,p_generation bigint)
returns boolean language plpgsql security invoker set search_path=''
as $function$
begin
  perform id from rmc_auth_private.journey_transactions where id=p_context_id and purpose='PREAUTH'
    and generation=p_generation for update;
  if not found then return false; end if;
  update rmc_auth_private.csrf_material set invalidated_at=clock_timestamp()
    where journey_id=p_context_id and generation=p_generation and invalidated_at is null;
  return found;
end
$function$;
create function rmc_auth_api.cleanup_preauth_contexts()
returns integer language plpgsql security invoker set search_path=''
as $function$
declare removed integer;
begin
  delete from rmc_auth_private.csrf_material where journey_id in
    (select c.journey_id from rmc_auth_private.csrf_material c
      join rmc_auth_private.journey_transactions j on j.id=c.journey_id
      where j.purpose='PREAUTH' and c.expires_at <= clock_timestamp()
      order by c.expires_at limit 100);
  delete from rmc_auth_private.journey_transactions where id in
    (select j.id from rmc_auth_private.journey_transactions j
      where j.purpose='PREAUTH' and j.expires_at <= clock_timestamp()
        and not exists(select 1 from rmc_auth_private.csrf_material c where c.journey_id=j.id)
        and not exists(select 1 from rmc_auth_private.challenges c where c.journey_id=j.id)
      order by j.expires_at limit 100);
  get diagnostics removed=row_count;
  delete from rmc_auth_private.rate_limit_buckets where (bucket_hash,purpose,window_started_at) in
    (select bucket_hash,purpose,window_started_at from rmc_auth_private.rate_limit_buckets
      where purpose in ('PREAUTH_GLOBAL','PREAUTH_IP') and expires_at <= clock_timestamp()
      order by expires_at limit 100);
  return removed;
end
$function$;

grant select,insert,delete on rmc_auth_private.csrf_material to service_role;
grant update(invalidated_at) on rmc_auth_private.csrf_material to service_role;
grant insert,delete on rmc_auth_private.journey_transactions to service_role;
grant select,insert,delete on rmc_auth_private.rate_limit_buckets to service_role;
grant update(consumed) on rmc_auth_private.rate_limit_buckets to service_role;
revoke all on function rmc_auth_private.guard_csrf_material() from public,anon,authenticated;
revoke all on function rmc_auth_api.read_preauth_context(bytea),
  rmc_auth_api.create_preauth_context(uuid,bytea,bytea,bytea,bytea,integer,bytea),
  rmc_auth_api.validate_preauth_csrf(uuid,bigint,bytea),
  rmc_auth_api.invalidate_preauth_csrf(uuid,bigint),rmc_auth_api.cleanup_preauth_contexts()
  from public,anon,authenticated;
grant execute on function rmc_auth_api.read_preauth_context(bytea),
  rmc_auth_api.create_preauth_context(uuid,bytea,bytea,bytea,bytea,integer,bytea),
  rmc_auth_api.validate_preauth_csrf(uuid,bigint,bytea),
  rmc_auth_api.invalidate_preauth_csrf(uuid,bigint),rmc_auth_api.cleanup_preauth_contexts()
  to service_role;
