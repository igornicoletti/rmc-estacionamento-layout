-- F05 local delivery boundary. No journey producer or target gateway is enabled.
create table rmc_auth_private.delivery_control (
  singleton boolean primary key default true check(singleton),
  enabled boolean not null default false,
  key_versions integer[] not null default '{}'
);
insert into rmc_auth_private.delivery_control(singleton) values(true);
alter table rmc_auth_private.delivery_control enable row level security;
alter table rmc_auth_private.delivery_control force row level security;
alter table rmc_auth_private.delivery_outbox add column publish_fence bigint not null default 0;
create table rmc_auth_private.delivery_processing (
  outbox_id uuid primary key references rmc_auth_private.delivery_outbox(id),
  state text not null check(state in ('PREPARED','REQUESTED','UNKNOWN','RECONCILIATION_REQUIRED','ACCEPTED','DELIVERED','REJECTED','STALE','DEAD')),
  owner uuid not null check(owner::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  fence bigint not null default 1,
  lease_until timestamptz not null,
  attempts integer not null default 1 check(attempts between 1 and 5),
  requested_at timestamptz,
  next_reconcile_at timestamptz not null default clock_timestamp(),
  reconcile_attempts bigint not null default 0 check(reconcile_attempts>=0)
);
create table rmc_auth_private.delivery_receipts (
  receipt_id uuid primary key check(receipt_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  outbox_id uuid not null references rmc_auth_private.delivery_outbox(id),
  outcome text not null check(outcome in ('DELIVERED','REJECTED')),
  occurred_at timestamptz not null,
  received_at timestamptz not null default clock_timestamp()
);
alter table rmc_auth_private.delivery_processing enable row level security;
alter table rmc_auth_private.delivery_processing force row level security;
alter table rmc_auth_private.delivery_receipts enable row level security;
alter table rmc_auth_private.delivery_receipts force row level security;
create index delivery_processing_reconcile_idx on rmc_auth_private.delivery_processing(next_reconcile_at,outbox_id)
where state in ('REQUESTED','UNKNOWN','RECONCILIATION_REQUIRED');
create index delivery_receipts_outbox_idx on rmc_auth_private.delivery_receipts(outbox_id);
create table rmc_auth_private.delivery_quarantine (
  message_hash bytea primary key check(octet_length(message_hash)=32),
  queue text not null check(queue='auth-delivery-dlq'),
  reason text not null check(reason in ('MALFORMED','DISABLED')),
  outbox_id uuid references rmc_auth_private.delivery_outbox(id),
  received_at timestamptz not null default clock_timestamp()
);
alter table rmc_auth_private.delivery_quarantine enable row level security;
alter table rmc_auth_private.delivery_quarantine force row level security;
create index delivery_quarantine_outbox_idx on rmc_auth_private.delivery_quarantine(outbox_id);
create function rmc_auth_api.quarantine_delivery(p_message text,p_queue text,p_reason text,p_body jsonb default null) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if p_message is null or length(p_message) not between 1 and 256
 or p_queue is distinct from 'auth-delivery-dlq' or p_reason is null or p_reason not in ('MALFORMED','DISABLED') then return false; end if;
 insert into rmc_auth_private.delivery_quarantine(message_hash,queue,reason,outbox_id)
 values(extensions.digest(convert_to(jsonb_build_array(p_queue,p_message)::text,'UTF8'),'sha256'),p_queue,p_reason,
 (select id from rmc_auth_private.delivery_outbox o where rmc_auth_private.delivery_message(o.id)=p_body))
 on conflict(message_hash) do nothing;
 return true;
end $$;
revoke all on function rmc_auth_api.quarantine_delivery(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function rmc_auth_api.quarantine_delivery(text,text,text,jsonb) to service_role;
grant insert on rmc_auth_private.delivery_quarantine to service_role;
grant select(message_hash) on rmc_auth_private.delivery_quarantine to service_role;

create function rmc_auth_private.audit_delivery(p_id uuid,p_reason text) returns void
language plpgsql security invoker set search_path='' as $$
declare event_id uuid;
begin
 insert into rmc_auth_private.audit_events(event_type,request_id,identity_id,purpose,generation,outcome,
 reason_code,contract_version,deployment_id)
 select 'DELIVERY_OUTCOME',o.id::text,o.identity_id,o.purpose,o.generation,
 case when p_reason='RECONCILIATION_REQUIRED' then 'UNKNOWN' else 'SUCCESS' end,
 p_reason,'1.1','F05-local' from rmc_auth_private.delivery_outbox o where id=p_id returning id into event_id;
 insert into rmc_auth_private.audit_outbox(event_id) values(event_id);
end $$;
revoke all on function rmc_auth_private.audit_delivery(uuid,text) from public,anon,authenticated;
grant execute on function rmc_auth_private.audit_delivery(uuid,text) to service_role;

-- Identity -> journey -> challenge -> outbox -> processing is the canonical lock order.
create function rmc_auth_private.delivery_message(p_id uuid) returns jsonb
language sql security invoker set search_path='' as $$
 select jsonb_build_object('schemaVersion',1,'messageId',o.id,'outboxId',o.id,
 'idempotencyKey',o.idempotency_key,'challengeId',o.challenge_id,
 'purpose',case when o.purpose='PREAUTH' then 'ACTIVATION' else 'RECOVERY' end,
 'generation',o.generation,'createdAt',to_char(o.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
 'envelope',jsonb_build_object('codecVersion',1,'algorithm','A256GCM','purpose','SMS_DELIVERY',
 'keyVersion',o.key_version,'binding',replace(jsonb_build_array(1,'SMS_DELIVERY',o.id,o.challenge_id,
 case when o.purpose='PREAUTH' then 'ACTIVATION' else 'RECOVERY' end,o.generation,o.idempotency_key)::text,', ',','),
 'ciphertext',translate(rtrim(replace(encode(o.envelope_ciphertext,'base64'),E'\n',''),'='),'+/','-_')))
 from rmc_auth_private.delivery_outbox o where o.id=p_id
$$;
create function rmc_auth_api.claim_delivery(p_owner uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb; expired_id uuid;
begin
 if p_owner is null then raise exception using errcode='22023',message='INVALID_OWNER'; end if;
 if not exists(select 1 from rmc_auth_private.delivery_control where singleton and enabled) then return '[]'::jsonb; end if;
 for expired_id in
 with expired as (
 select id from rmc_auth_private.delivery_outbox where state='CLAIMED'
 and lease_expires_at<=clock_timestamp() and attempt_count>=max_attempts
 order by lease_expires_at,id for update skip locked limit 10
 ) update rmc_auth_private.delivery_outbox o set state='DEAD_LETTER',lease_owner=null,lease_expires_at=null
 from expired e where o.id=e.id returning o.id
 loop perform rmc_auth_private.audit_delivery(expired_id,'RECONCILIATION_REQUIRED'); end loop;
 with candidates as (
 select id from rmc_auth_private.delivery_outbox
 where (state in ('PENDING','FAILED') or (state='CLAIMED' and lease_expires_at<=clock_timestamp())
  or (state='PUBLISHED' and published_at<=clock_timestamp()-interval '5 minutes'
  and not exists(select 1 from rmc_auth_private.delivery_processing p where p.outbox_id=delivery_outbox.id
  and (p.state<>'PREPARED' or p.lease_until>clock_timestamp()))))
 and next_attempt_at<=clock_timestamp() and attempt_count<max_attempts
 order by next_attempt_at,id for update skip locked limit 10
 ), claimed as (
 update rmc_auth_private.delivery_outbox o set state='CLAIMED',lease_owner=p_owner,
 lease_expires_at=clock_timestamp()+interval '30 seconds',publish_fence=publish_fence+1,attempt_count=attempt_count+1
 from candidates c where o.id=c.id returning o.id,o.publish_fence)
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'fence',publish_fence)),'[]') into result from claimed;
 -- Separate statement reads writes of the CTE after commit visibility within this transaction.
 select coalesce(jsonb_agg(jsonb_build_object('message',rmc_auth_private.delivery_message((x->>'id')::uuid),
 'fence',(x->>'fence')::bigint)),'[]') into result from jsonb_array_elements(result) x;
 return result;
end $$;
create function rmc_auth_api.finish_delivery_publish(p_id uuid,p_owner uuid,p_fence bigint,p_success boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_success is null then return false; end if;
 update rmc_auth_private.delivery_outbox set state=case when p_success then 'PUBLISHED'::rmc_auth_private.delivery_state
 when attempt_count>=max_attempts then 'DEAD_LETTER'::rmc_auth_private.delivery_state else 'FAILED'::rmc_auth_private.delivery_state end,
 published_at=case when p_success then clock_timestamp() else published_at end,
 next_attempt_at=clock_timestamp()+interval '30 seconds',lease_owner=null,lease_expires_at=null
 where id=p_id and state='CLAIMED' and lease_owner=p_owner and publish_fence=p_fence and lease_expires_at>clock_timestamp();
 return found;
end $$;
create function rmc_auth_api.admit_delivery(p_id uuid,p_owner uuid,p_message jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare o rmc_auth_private.delivery_outbox%rowtype; c rmc_auth_private.challenges%rowtype;
 j rmc_auth_private.journey_transactions%rowtype; i rmc_auth_private.identities%rowtype;
 a rmc_auth_private.delivery_processing%rowtype; phone rmc_auth_private.provisioning_phone_sources%rowtype;
 stale boolean;
begin
 if p_owner is null or not exists(select 1 from rmc_auth_private.delivery_control where singleton and enabled) then return '{"kind":"RETRY"}'::jsonb; end if;
 select * into o from rmc_auth_private.delivery_outbox where id=p_id;
 if o.id is null or p_message is distinct from rmc_auth_private.delivery_message(p_id) then return '{"kind":"RETRY"}'::jsonb; end if;
 select * into c from rmc_auth_private.challenges where id=o.challenge_id;
 select * into i from rmc_auth_private.identities where id=o.identity_id for share;
 select * into j from rmc_auth_private.journey_transactions where id=c.journey_id for share;
 select * into c from rmc_auth_private.challenges where id=o.challenge_id for share;
 select * into o from rmc_auth_private.delivery_outbox where id=p_id for update;
 select * into a from rmc_auth_private.delivery_processing where outbox_id=p_id for update;
 if p_message is distinct from rmc_auth_private.delivery_message(p_id) then return '{"kind":"RETRY"}'::jsonb; end if;
 if a.state in ('ACCEPTED','DELIVERED','REJECTED','STALE','DEAD') then return '{"kind":"DONE"}'::jsonb; end if;
 if a.outbox_id is not null and a.lease_until>clock_timestamp() then return '{"kind":"RETRY"}'::jsonb; end if;
 if a.state in ('REQUESTED','UNKNOWN','RECONCILIATION_REQUIRED') then
 update rmc_auth_private.delivery_processing set state='REQUESTED',owner=p_owner,fence=fence+1,
 lease_until=clock_timestamp()+interval '30 seconds' where outbox_id=p_id returning * into a;
 return jsonb_build_object('kind','UNKNOWN','fence',a.fence);
 end if;
 stale:=o.identity_id is null or c.consumed_at is not null or c.expires_at<=clock_timestamp()
 or c.generation<>o.generation or c.purpose<>o.purpose or j.state<>'PENDING' or j.consumed_at is not null
 or j.generation<>o.generation or j.expires_at<=clock_timestamp() or j.identity_generation<>i.generation
 or c.attempt_count>=c.max_attempts or c.binding_hash<>o.binding_hash
 or not ((o.purpose='PREAUTH' and i.lifecycle='PENDING' and i.onboarding='ACTIVATION_REQUIRED')
 or (o.purpose='RECOVERY' and i.lifecycle='ACTIVE' and i.onboarding='COMPLETE'));
 if stale is distinct from false then
 insert into rmc_auth_private.delivery_processing(outbox_id,state,owner,lease_until)
 values(p_id,'STALE',p_owner,clock_timestamp()) on conflict(outbox_id) do update set state='STALE',lease_until=clock_timestamp();
 perform rmc_auth_private.audit_delivery(p_id,'STALE');
 return '{"kind":"STALE"}'::jsonb; end if;
 if not exists(select 1 from rmc_auth_private.delivery_control where singleton and o.key_version=any(key_versions)) then return '{"kind":"RETRY"}'::jsonb; end if;
 select * into phone from rmc_auth_private.provisioning_phone_sources where identity_id=i.id and identity_generation=i.generation;
 if phone.identity_id is null then return '{"kind":"RETRY"}'::jsonb; end if;
 if a.attempts>=5 then
 update rmc_auth_private.delivery_processing set state='DEAD',lease_until=clock_timestamp() where outbox_id=p_id;
 perform rmc_auth_private.audit_delivery(p_id,'RECONCILIATION_REQUIRED');
 return '{"kind":"DONE"}'::jsonb; end if;
 insert into rmc_auth_private.delivery_processing(outbox_id,state,owner,lease_until)
 values(p_id,'PREPARED',p_owner,clock_timestamp()+interval '30 seconds') on conflict(outbox_id) do update
 set state='PREPARED',owner=p_owner,fence=rmc_auth_private.delivery_processing.fence+1,
 attempts=rmc_auth_private.delivery_processing.attempts+1,lease_until=clock_timestamp()+interval '30 seconds'
 returning * into a;
 return jsonb_build_object('kind','READY','fence',a.fence,
 'phone',jsonb_build_object('identityId',i.id,'generation',i.generation,'keyVersion',phone.key_version,
 'ciphertext',translate(rtrim(replace(encode(phone.ciphertext,'base64'),E'\n',''),'='),'+/','-_')));
end $$;

create function rmc_auth_api.begin_delivery(p_id uuid,p_owner uuid,p_fence bigint,p_message jsonb,p_phone jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare o rmc_auth_private.delivery_outbox%rowtype; c rmc_auth_private.challenges%rowtype;
 j rmc_auth_private.journey_transactions%rowtype; i rmc_auth_private.identities%rowtype;
 a rmc_auth_private.delivery_processing%rowtype; phone rmc_auth_private.provisioning_phone_sources%rowtype;
 stale boolean;
begin
 select * into o from rmc_auth_private.delivery_outbox where id=p_id;
 select * into c from rmc_auth_private.challenges where id=o.challenge_id;
 select * into i from rmc_auth_private.identities where id=o.identity_id for share;
 select * into j from rmc_auth_private.journey_transactions where id=c.journey_id for share;
 select * into c from rmc_auth_private.challenges where id=o.challenge_id for share;
 select * into o from rmc_auth_private.delivery_outbox where id=p_id for update;
 select * into a from rmc_auth_private.delivery_processing where outbox_id=p_id for update;
 if a.outbox_id is null or a.state<>'PREPARED' or a.owner is distinct from p_owner
 or a.fence is distinct from p_fence or a.lease_until<=clock_timestamp()
 or p_message is distinct from rmc_auth_private.delivery_message(p_id) then return false; end if;
 stale:=o.identity_id is null or c.consumed_at is not null or c.expires_at<=clock_timestamp()
 or c.generation<>o.generation or c.purpose<>o.purpose or j.state<>'PENDING' or j.consumed_at is not null
 or j.generation<>o.generation or j.expires_at<=clock_timestamp() or j.identity_generation<>i.generation
 or c.attempt_count>=c.max_attempts or c.binding_hash<>o.binding_hash
 or not ((o.purpose='PREAUTH' and i.lifecycle='PENDING' and i.onboarding='ACTIVATION_REQUIRED')
 or (o.purpose='RECOVERY' and i.lifecycle='ACTIVE' and i.onboarding='COMPLETE'));
 if stale is distinct from false or not exists(select 1 from rmc_auth_private.delivery_control where singleton and enabled
 and o.key_version=any(key_versions)) then return false; end if;
 -- The controlled source is immutable to this role; authority is locked on identity.
 -- FOR SHARE would require UPDATE privileges and unnecessarily widen the BFF's grants.
 select * into phone from rmc_auth_private.provisioning_phone_sources where identity_id=i.id and identity_generation=i.generation;
 if phone.identity_id is null or p_phone is distinct from jsonb_build_object('identityId',i.id,'generation',i.generation,
 'keyVersion',phone.key_version,'ciphertext',translate(rtrim(replace(encode(phone.ciphertext,'base64'),E'\n',''),'='),'+/','-_')) then return false; end if;
 update rmc_auth_private.delivery_processing set state='REQUESTED',requested_at=clock_timestamp() where outbox_id=p_id;
 return true;
end $$;

-- Reconciliation never decrypts or sends. It remains available with the send kill switch off.
create function rmc_auth_api.claim_delivery_reconciliation(p_owner uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_owner is null then raise exception using errcode='22023',message='INVALID_OWNER'; end if;
 with candidates as (
 select outbox_id from rmc_auth_private.delivery_processing
 where state in ('REQUESTED','UNKNOWN','RECONCILIATION_REQUIRED') and lease_until<=clock_timestamp()
 and next_reconcile_at<=clock_timestamp()
 order by next_reconcile_at,outbox_id for update skip locked limit 5
 ), claimed as (
 update rmc_auth_private.delivery_processing p set state='REQUESTED',owner=p_owner,fence=fence+1,
 lease_until=clock_timestamp()+interval '30 seconds',reconcile_attempts=reconcile_attempts+1,
 next_reconcile_at=clock_timestamp()+interval '5 minutes'
 from candidates c where p.outbox_id=c.outbox_id returning p.outbox_id,p.fence)
 select coalesce(jsonb_agg(jsonb_build_object('id',outbox_id,'fence',fence)),'[]') into result from claimed;
 select coalesce(jsonb_agg(jsonb_build_object('message',rmc_auth_private.delivery_message((x->>'id')::uuid),
 'fence',(x->>'fence')::bigint)),'[]') into result from jsonb_array_elements(result) x;
 return result;
end $$;

create function rmc_auth_api.finish_delivery(p_id uuid,p_owner uuid,p_fence bigint,p_outcome text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare a rmc_auth_private.delivery_processing%rowtype;
begin
 if p_outcome is null or p_outcome not in ('ACCEPTED','DELIVERED','REJECTED','UNKNOWN','RECONCILIATION_REQUIRED') then return false; end if;
 perform id from rmc_auth_private.delivery_outbox where id=p_id for update;
 select * into a from rmc_auth_private.delivery_processing where outbox_id=p_id for update;
 if (a.state='PREPARED' and p_outcome='UNKNOWN') or a.state not in ('PREPARED','REQUESTED') or a.owner is distinct from p_owner or a.fence is distinct from p_fence
 or a.lease_until<=clock_timestamp() then return false; end if;
 update rmc_auth_private.delivery_processing set state=p_outcome,lease_until=clock_timestamp(),next_reconcile_at=clock_timestamp()+interval '5 minutes',
 requested_at=case when p_outcome in ('ACCEPTED','DELIVERED','REJECTED') then coalesce(requested_at,clock_timestamp()) else requested_at end where outbox_id=p_id;
 insert into rmc_auth_private.delivery_attempts(outbox_id,attempt_number,provider_outcome)
 values(p_id,(select coalesce(max(attempt_number),0)+1 from rmc_auth_private.delivery_attempts where outbox_id=p_id),case when p_outcome in ('ACCEPTED','DELIVERED') then 'ACCEPTED'
 when p_outcome='REJECTED' then 'REJECTED' else 'UNKNOWN' end);
 perform rmc_auth_private.audit_delivery(p_id,case when p_outcome='DELIVERED' then 'DELIVERED'
 when p_outcome='ACCEPTED' then 'ACCEPTED' else 'RECONCILIATION_REQUIRED' end);
 return true;
end $$;
create function rmc_auth_api.apply_delivery_receipt(p_receipt uuid,p_id uuid,p_key uuid,p_outcome text,p_timestamp timestamptz)
returns boolean language plpgsql security invoker set search_path='' as $$
declare a rmc_auth_private.delivery_processing%rowtype;
begin
 if p_receipt is null or p_outcome is null or p_outcome not in ('DELIVERED','REJECTED')
 or p_timestamp is null or abs(extract(epoch from clock_timestamp()-p_timestamp))>300 then return false; end if;
 perform id from rmc_auth_private.delivery_outbox where id=p_id and idempotency_key=p_key for update;
 if not found then return false; end if;
 select * into a from rmc_auth_private.delivery_processing where outbox_id=p_id for update;
 if a.outbox_id is null or a.requested_at is null then return false; end if;
 if exists(select 1 from rmc_auth_private.delivery_receipts where receipt_id=p_receipt) then
 return exists(select 1 from rmc_auth_private.delivery_receipts where receipt_id=p_receipt
 and outbox_id=p_id and outcome=p_outcome and occurred_at=p_timestamp); end if;
 insert into rmc_auth_private.delivery_receipts(receipt_id,outbox_id,outcome,occurred_at) values(p_receipt,p_id,p_outcome,p_timestamp);
 if a.state<>'DELIVERED' then update rmc_auth_private.delivery_processing set state=p_outcome,lease_until=clock_timestamp(),next_reconcile_at=clock_timestamp()+interval '5 minutes',
 requested_at=case when p_outcome in ('ACCEPTED','DELIVERED','REJECTED') then coalesce(requested_at,clock_timestamp()) else requested_at end where outbox_id=p_id; end if;
 perform rmc_auth_private.audit_delivery(p_id,case when p_outcome='DELIVERED' then 'DELIVERED' else 'RECONCILIATION_REQUIRED' end);
 return true;
end $$;

grant select on rmc_auth_private.delivery_control,rmc_auth_private.delivery_outbox,
 rmc_auth_private.provisioning_phone_sources,rmc_auth_private.delivery_processing,rmc_auth_private.delivery_receipts to service_role;
grant update(state,lease_owner,lease_expires_at,publish_fence,attempt_count,published_at,next_attempt_at)
 on rmc_auth_private.delivery_outbox to service_role;
grant insert,update on rmc_auth_private.delivery_processing to service_role;
grant select,insert on rmc_auth_private.delivery_attempts,rmc_auth_private.delivery_receipts to service_role;
grant usage on sequence rmc_auth_private.delivery_attempts_id_seq to service_role;
revoke all on function rmc_auth_private.delivery_message(uuid) from public,anon,authenticated;
grant execute on function rmc_auth_private.delivery_message(uuid) to service_role;
revoke all on function rmc_auth_api.claim_delivery(uuid),
 rmc_auth_api.finish_delivery_publish(uuid,uuid,bigint,boolean),rmc_auth_api.admit_delivery(uuid,uuid,jsonb),
 rmc_auth_api.finish_delivery(uuid,uuid,bigint,text),rmc_auth_api.apply_delivery_receipt(uuid,uuid,uuid,text,timestamptz)
 from public,anon,authenticated;
grant execute on function rmc_auth_api.claim_delivery(uuid),
 rmc_auth_api.finish_delivery_publish(uuid,uuid,bigint,boolean),rmc_auth_api.admit_delivery(uuid,uuid,jsonb),
 rmc_auth_api.finish_delivery(uuid,uuid,bigint,text),rmc_auth_api.apply_delivery_receipt(uuid,uuid,uuid,text,timestamptz) to service_role;

-- This local inventory is necessary, never sufficient for hosted Queue/DLQ/backup retirement.
create function rmc_auth_api.delivery_key_inventory() returns jsonb
language sql security invoker set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('purpose',purpose,'keyVersion',key_version,'references',total)),'[]'::jsonb)
  from (select 'SMS_DELIVERY'::text purpose,key_version,count(*) total from rmc_auth_private.delivery_outbox group by key_version
  union all select 'PHONE',key_version,count(*) from rmc_auth_private.provisioning_phone_sources group by key_version) inventory
$$;
revoke all on function rmc_auth_api.delivery_key_inventory() from public,anon,authenticated;
grant execute on function rmc_auth_api.delivery_key_inventory() to service_role;

revoke all on function rmc_auth_api.begin_delivery(uuid,uuid,bigint,jsonb,jsonb),rmc_auth_api.claim_delivery_reconciliation(uuid) from public,anon,authenticated;
grant execute on function rmc_auth_api.begin_delivery(uuid,uuid,bigint,jsonb,jsonb),rmc_auth_api.claim_delivery_reconciliation(uuid) to service_role;
