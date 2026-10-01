begin;
set local search_path=extensions,public;
select plan(30);
select has_table('rmc_auth_private','csrf_material','CSRF is private persistence');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='rmc_auth_private.csrf_material'::regclass),'CSRF RLS defense in depth');
select ok(not has_table_privilege('anon','rmc_auth_private.csrf_material','SELECT'),'anon cannot read CSRF');
select ok(not has_table_privilege('authenticated','rmc_auth_private.csrf_material','SELECT'),'authenticated cannot read CSRF');
select ok(not has_function_privilege('anon','rmc_auth_api.read_preauth_context(bytea)','EXECUTE'),'anon cannot execute context RPC');
select ok(not has_function_privilege('authenticated','rmc_auth_api.create_preauth_context(uuid,bytea,bytea,bytea,bytea,integer,bytea)','EXECUTE'),'authenticated cannot create context');
select ok(not exists(select 1 from pg_proc where pronamespace='rmc_auth_api'::regnamespace and proname like '%preauth%' and prosecdef),'PREAUTH functions invoker');
select ok((select rolbypassrls from pg_roles where rolname='service_role'),'service role bypass is explicit, not contained by FORCE RLS');
set local role service_role;
select lives_ok($$select rmc_auth_api.create_preauth_context('10000000-0000-4000-8000-000000000003',decode(repeat('11',32),'hex'),decode(repeat('22',32),'hex'),decode(repeat('33',60),'hex'),decode(repeat('44',32),'hex'),1,decode(repeat('55',32),'hex'))$$,'service role creates PREAUTH atomically');
select is((rmc_auth_api.read_preauth_context(decode(repeat('11',32),'hex'))->>'purpose'),'PREAUTH','context is not NORMAL');
select is((rmc_auth_api.read_preauth_context(decode(repeat('11',32),'hex'))->>'csrfHash'),repeat('22',32),'stored hash re-delivered unchanged');
select is((rmc_auth_api.read_preauth_context(decode(repeat('11',32),'hex'))->>'codecVersion'),'1','codec version is explicit');
select is((rmc_auth_api.read_preauth_context(decode(repeat('11',32),'hex'))->>'algorithm'),'A256GCM','algorithm is explicit');
select ok(rmc_auth_api.validate_preauth_csrf('10000000-0000-4000-8000-000000000003',1,decode(repeat('22',32),'hex')),'current token valid');
select ok(not rmc_auth_api.validate_preauth_csrf('10000000-0000-4000-8000-000000000003',2,decode(repeat('22',32),'hex')),'stale generation denied');
select ok(not rmc_auth_api.validate_preauth_csrf('10000000-0000-4000-8000-000000000003',1,decode(repeat('66',32),'hex')),'different token denied');
select ok(rmc_auth_api.invalidate_preauth_csrf('10000000-0000-4000-8000-000000000003',1),'invalidate current CSRF');
select ok(not rmc_auth_api.validate_preauth_csrf('10000000-0000-4000-8000-000000000003',1,decode(repeat('22',32),'hex')),'invalidated token denied');
select is(rmc_auth_api.read_preauth_context(decode(repeat('11',32),'hex')),null::jsonb,'invalidated context never falls back to existing anonymous');
reset role;
select throws_ok($$update rmc_auth_private.csrf_material set codec_version=2 where journey_id='10000000-0000-4000-8000-000000000003'$$,'23514',null,'unknown codec rejected');
select throws_ok($$update rmc_auth_private.csrf_material set algorithm='unknown' where journey_id='10000000-0000-4000-8000-000000000003'$$,'23514',null,'unknown algorithm rejected');
select throws_ok($$update rmc_auth_private.csrf_material set token_hash=decode(repeat('77',32),'hex') where journey_id='10000000-0000-4000-8000-000000000003'$$,'23514',null,'token material cannot be replaced in place');
insert into rmc_auth_private.journey_transactions(id,purpose,binding_hash,state,created_at,expires_at,secret_hash,key_version)
values('10000000-0000-4000-8000-000000000004','PREAUTH',decode(repeat('44',32),'hex'),'PENDING',clock_timestamp()-interval '31 minutes',clock_timestamp()-interval '1 minute',decode(repeat('88',32),'hex'),1);
select throws_ok($$insert into rmc_auth_private.csrf_material(journey_id,generation,token_hash,ciphertext,binding_hash,key_version,created_at,expires_at) values('10000000-0000-4000-8000-000000000004',1,decode(repeat('22',32),'hex'),decode(repeat('33',60),'hex'),decode(repeat('99',32),'hex'),1,clock_timestamp()-interval '31 minutes',clock_timestamp()-interval '2 minutes')$$,'23514',null,'binding mismatch cannot persist');
insert into rmc_auth_private.csrf_material(journey_id,generation,token_hash,ciphertext,binding_hash,key_version,created_at,expires_at)
values('10000000-0000-4000-8000-000000000004',1,decode(repeat('22',32),'hex'),decode(repeat('33',60),'hex'),decode(repeat('44',32),'hex'),1,clock_timestamp()-interval '31 minutes',clock_timestamp()-interval '2 minutes');
set local role service_role;
select ok(not rmc_auth_api.validate_preauth_csrf('10000000-0000-4000-8000-000000000004',1,decode(repeat('22',32),'hex')),'expired authority denied');
select is(rmc_auth_api.read_preauth_context(decode(repeat('88',32),'hex')),null::jsonb,'expired context not re-delivered');
select is(rmc_auth_api.cleanup_preauth_contexts(),1,'bounded cleanup removes expired PREAUTH');
do $test$ declare i integer; cid uuid; begin
  for i in 1..59 loop
    cid := gen_random_uuid();
    perform rmc_auth_api.create_preauth_context(cid,decode(md5(cid::text)||md5(cid::text),'hex'),decode(repeat('22',32),'hex'),decode(repeat('33',60),'hex'),decode(repeat('44',32),'hex'),1,decode(repeat('55',32),'hex'));
  end loop;
end $test$;
select is((rmc_auth_api.create_preauth_context('10000000-0000-4000-8000-000000000005',decode(repeat('aa',32),'hex'),decode(repeat('22',32),'hex'),decode(repeat('33',60),'hex'),decode(repeat('44',32),'hex'),1,decode(repeat('55',32),'hex'))->>'limited'),'true','61st creation blocked by persistent per-IP limiter');
reset role;
select throws_ok($$insert into rmc_auth_private.csrf_material(generation,token_hash,ciphertext,binding_hash,key_version,expires_at) values(1,decode(repeat('22',32),'hex'),decode(repeat('33',60),'hex'),decode(repeat('44',32),'hex'),1,clock_timestamp()+interval '1 hour')$$,'23514',null,'no unbound CSRF row');
insert into rmc_auth_private.rate_limit_buckets(bucket_hash,purpose,window_started_at,window_seconds,consumed,limit_value,expires_at)
values(decode(repeat('00',32),'hex'),'PREAUTH_GLOBAL',date_trunc('minute',clock_timestamp()),60,600,600,date_trunc('minute',clock_timestamp())+interval '2 minutes')
on conflict (bucket_hash,purpose,window_started_at) do update set consumed=600;
set local role service_role;
select is((rmc_auth_api.create_preauth_context('10000000-0000-4000-8000-000000000006',decode(repeat('bb',32),'hex'),decode(repeat('22',32),'hex'),decode(repeat('33',60),'hex'),decode(repeat('44',32),'hex'),1,decode(repeat('cc',32),'hex'))->>'limited'),'true','global limit rejects bootstrap');
select is((select count(*) from rmc_auth_private.rate_limit_buckets where purpose='PREAUTH_IP' and bucket_hash=decode(repeat('cc',32),'hex')),0::bigint,'global limiter blocks growth of new IP keys');
select * from finish();
rollback;
