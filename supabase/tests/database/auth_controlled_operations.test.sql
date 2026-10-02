begin;
set local search_path=extensions,public;
select no_plan();
select ok(not has_function_privilege('service_role','rmc_auth_private.begin_day_zero(uuid,uuid,uuid,bytea,uuid,integer,bytea,integer[],bytea[],integer,bytea,bytea)','EXECUTE'),'BFF cannot execute day-zero');
select ok(not has_table_privilege('anon','rmc_auth_private.day_zero_receipt','SELECT'),'receipt not public');
select ok(not has_table_privilege('authenticated','rmc_auth_private.provisioning_phone_sources','SELECT'),'phone never browser facing');
select is(rmc_auth_private.begin_day_zero('81000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000002',
 '81000000-0000-4000-8000-000000000003',decode(repeat('01',32),'hex'),'81000000-0000-4000-8000-000000000004',
 1,decode(repeat('02',39),'hex'),array[1],array[decode(repeat('03',32),'hex')],1,decode(repeat('04',42),'hex'),decode(repeat('05',32),'hex')),
 '81000000-0000-4000-8000-000000000002'::uuid,'controlled first-S claim atomic');
select is((select role from rmc_auth_private.identities where id='81000000-0000-4000-8000-000000000001'),'S','first identity is S');
select is((select lifecycle::text from rmc_auth_private.identities where id='81000000-0000-4000-8000-000000000001'),'PENDING','day-zero never normal');
select ok(not rmc_auth_private.finish_day_zero('81000000-0000-4000-8000-000000000002','81000000-0000-4000-8000-000000000004',gen_random_uuid()),'cannot close before actual commit');
select throws_ok($$select rmc_auth_private.begin_day_zero(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),decode(repeat('01',32),'hex'),gen_random_uuid(),1,decode(repeat('02',39),'hex'),array[1],array[decode(repeat('03',32),'hex')],1,decode(repeat('04',42),'hex'),decode(repeat('05',32),'hex'))$$,
 '23505','AUTH_DAY_ZERO_CONFLICT','second day-zero cannot create another S');
select is((select count(*)::integer from rmc_auth_private.identities where role='S'),1,'one first S');
select ok(not has_function_privilege('anon','rmc_auth_api.claim_provisioning_batch(uuid,integer)','EXECUTE'),'public cannot claim jobs');
select throws_ok($$select rmc_auth_api.claim_provisioning_batch(gen_random_uuid(),4)$$,'22023','AUTH_RECONCILE_BATCH_INVALID','batch upper bound');
create temporary table batch as select rmc_auth_api.claim_provisioning_batch('82000000-0000-4000-8000-000000000001',3) as value;
select is((select jsonb_array_length(value->'commandIds') from batch),0,'empty due list');
select ok(rmc_auth_api.claim_provisioning_batch(gen_random_uuid(),1) is null,'concurrent batch excluded');
select ok(not rmc_auth_api.settle_provisioning_batch(gen_random_uuid(),1,true),'wrong owner cannot settle');
select ok(rmc_auth_api.settle_provisioning_batch('82000000-0000-4000-8000-000000000001',1,false),'first failure persists');
select rmc_auth_api.claim_provisioning_batch('82000000-0000-4000-8000-000000000001',3);
select ok(rmc_auth_api.settle_provisioning_batch('82000000-0000-4000-8000-000000000001',2,false),'second failure persists');
select rmc_auth_api.claim_provisioning_batch('82000000-0000-4000-8000-000000000001',3);
select ok(rmc_auth_api.settle_provisioning_batch('82000000-0000-4000-8000-000000000001',3,false),'third failure opens circuit');
select ok(rmc_auth_api.claim_provisioning_batch(gen_random_uuid(),3) is null,'open circuit denies work');
select is((select failures from rmc_auth_private.provisioning_reconciler),3,'failure counter durable');
select ok((select open_until>clock_timestamp() from rmc_auth_private.provisioning_reconciler),'cooldown future');
select * from finish();
rollback;
