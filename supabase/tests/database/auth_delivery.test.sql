begin;
set local search_path=extensions,public;
select no_plan();
select is(rmc_auth_api.claim_delivery(gen_random_uuid()),'[]'::jsonb,'disabled dispatcher');
select ok(not has_function_privilege('anon','rmc_auth_api.claim_delivery(uuid)','EXECUTE'),'anon denied');
select ok(not has_table_privilege('service_role','rmc_auth_private.delivery_control','UPDATE'),'operator-only kill switch');
select ok(not has_table_privilege('authenticated','rmc_auth_private.provisioning_phone_sources','SELECT'),'phone remains private');
insert into rmc_auth_private.identities(id,role) values('05000000-0000-4000-8000-000000000001','R');
insert into rmc_auth_private.provisioning_phone_sources(identity_id,identity_generation,key_version,ciphertext)
values('05000000-0000-4000-8000-000000000001',1,1,decode(repeat('ab',42),'hex'));
insert into rmc_auth_private.journey_transactions(id,identity_id,purpose,binding_hash,state,expires_at,secret_hash,key_version)
values('05000000-0000-4000-8000-000000000002','05000000-0000-4000-8000-000000000001','PREAUTH',decode(repeat('ab',32),'hex'),'PENDING',clock_timestamp()+interval '10 minutes',decode(repeat('cd',32),'hex'),1);
select lives_ok($$select rmc_auth_api.create_delivery_challenge('05000000-0000-4000-8000-000000000003','05000000-0000-4000-8000-000000000002',1,
decode(repeat('aa',32),'hex'),decode(repeat('bb',40),'hex'),1,clock_timestamp()+interval '5 minutes',5,
'05000000-0000-4000-8000-000000000004',decode(repeat('cc',46),'hex'),1,'05000000-0000-4000-8000-000000000005')$$,'challenge and outbox atomic');
update rmc_auth_private.delivery_control set enabled=true,key_versions=array[1];
create temp table claim as select rmc_auth_api.claim_delivery('05000000-0000-4000-8000-000000000006') value;
select is(jsonb_array_length((select value from claim)),1,'one bounded claim');
select is(rmc_auth_api.claim_delivery(gen_random_uuid()),'[]'::jsonb,'second dispatcher cannot claim live lease');
select ok(not rmc_auth_api.finish_delivery_publish('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000006',2,true),'stale publish fence denied');
select ok(rmc_auth_api.finish_delivery_publish('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000006',1,true),'publish committed');
select is(rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004',gen_random_uuid(),'{}')->>'kind','RETRY','mismatch denied before decrypt');
create temp table admitted as select rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004')) value;
select is((select value->>'kind' from admitted),'READY','current identity/journey/phone admitted');
select is(rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004',gen_random_uuid(),
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'))->>'kind','RETRY','live consumer lease excludes duplicate');
grant select on admitted to service_role;
select ok(not has_table_privilege('service_role','rmc_auth_private.provisioning_phone_sources','UPDATE'),'delivery cannot rewrite source phone');
set local role service_role;
select ok(rmc_auth_api.begin_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',1,
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'),(select value->'phone' from admitted)),'prepared claim begins external intent');
reset role;
select ok(rmc_auth_api.finish_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',1,'UNKNOWN'),'unknown persisted');
create temp table reconciled as select rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000008',
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004')) value;
select is((select value->>'kind' from reconciled),'UNKNOWN','unknown requires lookup no resend');
select ok(not rmc_auth_api.finish_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',1,'ACCEPTED'),'old consumer fence denied');
select ok(rmc_auth_api.finish_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000008',2,'ACCEPTED'),'accepted durable');
select is(rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004',gen_random_uuid(),
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'))->>'kind','DONE','terminal duplicate no outbound');
savepoint current_fixture;
delete from rmc_auth_private.delivery_processing;
update rmc_auth_private.delivery_control set key_versions='{}';
select is(rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004',gen_random_uuid(),
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'))->>'kind','RETRY','unknown key before decrypt');
rollback to current_fixture;
delete from rmc_auth_private.delivery_processing;
update rmc_auth_private.identities set generation=2 where id='05000000-0000-4000-8000-000000000001';
select is(rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004',gen_random_uuid(),
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'))->>'kind','STALE','identity fence rejects old generation');
select is((select state from rmc_auth_private.delivery_processing where outbox_id='05000000-0000-4000-8000-000000000004'),'STALE','stale persisted before ack');
rollback to current_fixture;
delete from rmc_auth_private.delivery_processing;
update rmc_auth_private.journey_transactions set state='CANCELLED' where id='05000000-0000-4000-8000-000000000002';
select is(rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004',gen_random_uuid(),
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'))->>'kind','STALE','cancelled/reordered journey never outbound');
rollback to current_fixture;
select ok(not rmc_auth_api.apply_delivery_receipt(gen_random_uuid(),'05000000-0000-4000-8000-000000000004',gen_random_uuid(),'DELIVERED',clock_timestamp()),'receipt wrong correlation denied');
select ok(not rmc_auth_api.apply_delivery_receipt(gen_random_uuid(),'05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000005','DELIVERED',clock_timestamp()-interval '6 minutes'),'expired receipt denied');
create temp table receipt_time as select clock_timestamp() value;
select ok(rmc_auth_api.apply_delivery_receipt('05000000-0000-4000-8000-000000000009','05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000005','DELIVERED',(select value from receipt_time)),'receipt delivered');
select ok(rmc_auth_api.apply_delivery_receipt('05000000-0000-4000-8000-000000000009','05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000005','DELIVERED',(select value from receipt_time)),'receipt replay idempotent');
select ok(not rmc_auth_api.apply_delivery_receipt('05000000-0000-4000-8000-000000000009','05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000005','REJECTED',(select value from receipt_time)),'conflicting receipt denied');
select ok(rmc_auth_api.apply_delivery_receipt(gen_random_uuid(),'05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000005','REJECTED',clock_timestamp()),'reordered negative receipt recorded');
select is((select state from rmc_auth_private.delivery_processing where outbox_id='05000000-0000-4000-8000-000000000004'),'DELIVERED','delivered never regresses');
set local role service_role;
select ok(rmc_auth_api.quarantine_delivery('synthetic-poison','auth-delivery-dlq','MALFORMED'),'poison durable metadata under runtime grants');
select ok(rmc_auth_api.quarantine_delivery('synthetic-poison','auth-delivery-dlq','MALFORMED'),'quarantine replay idempotent');
reset role;
select is((select count(*)::integer from rmc_auth_private.delivery_quarantine),1,'one redacted quarantine entry');
insert into rmc_auth_private.journey_transactions(id,purpose,binding_hash,state,expires_at,created_at,secret_hash,key_version)
values('05000000-0000-4000-8000-000000000010','PREAUTH',decode(repeat('ab',32),'hex'),'PENDING',clock_timestamp()+interval '10 minutes',clock_timestamp(),decode(repeat('aa',32),'hex'),1);
select rmc_auth_api.create_delivery_challenge('05000000-0000-4000-8000-000000000011','05000000-0000-4000-8000-000000000010',1,
decode(repeat('aa',32),'hex'),decode(repeat('bb',40),'hex'),1,clock_timestamp()+interval '5 minutes',5,
'05000000-0000-4000-8000-000000000012',decode(repeat('cc',46),'hex'),1,'05000000-0000-4000-8000-000000000013');
select is(rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000012',gen_random_uuid(),
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000012'))->>'kind','STALE','decoy never resolves phone or sends');
insert into rmc_auth_private.journey_transactions(id,identity_id,purpose,binding_hash,state,expires_at,created_at,secret_hash,key_version)
values('05000000-0000-4000-8000-000000000014','05000000-0000-4000-8000-000000000001','PREAUTH',decode(repeat('ab',32),'hex'),'PENDING',clock_timestamp()-interval '1 minute',clock_timestamp()-interval '2 minutes',decode(repeat('ee',32),'hex'),1);
insert into rmc_auth_private.challenges(id,journey_id,identity_id,purpose,verifier_hash,ciphertext,key_version,binding_hash,generation,max_attempts,expires_at,created_at)
values('05000000-0000-4000-8000-000000000015','05000000-0000-4000-8000-000000000014','05000000-0000-4000-8000-000000000001','PREAUTH',decode(repeat('aa',32),'hex'),decode(repeat('bb',40),'hex'),1,decode(repeat('ab',32),'hex'),1,5,clock_timestamp()-interval '1 minute',clock_timestamp()-interval '2 minutes');
insert into rmc_auth_private.delivery_outbox(id,challenge_id,identity_id,purpose,envelope_ciphertext,key_version,binding_hash,idempotency_key,generation,max_attempts)
values('05000000-0000-4000-8000-000000000016','05000000-0000-4000-8000-000000000015','05000000-0000-4000-8000-000000000001','PREAUTH',decode(repeat('cc',46),'hex'),1,decode(repeat('ab',32),'hex'),'05000000-0000-4000-8000-000000000017',1,5);
select is(rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000016',gen_random_uuid(),
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000016'))->>'kind','STALE','expired challenge never outbound');
rollback to current_fixture;
delete from rmc_auth_private.delivery_processing;
update rmc_auth_private.identities set generation=2 where id='05000000-0000-4000-8000-000000000001';
create function pg_temp.reject_delivery_audit() returns trigger language plpgsql as $$begin raise exception using errcode='22023',message='SYNTHETIC_AUDIT_FAILURE'; end $$;
create trigger synthetic_delivery_audit before insert on rmc_auth_private.audit_events for each row execute function pg_temp.reject_delivery_audit();
select throws_ok($$select rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004',gen_random_uuid(),
rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'))$$,'22023','SYNTHETIC_AUDIT_FAILURE','audit failure denies stale ack');
select is((select count(*)::integer from rmc_auth_private.delivery_processing),0,'audit failure rolls back outcome');
rollback to current_fixture;
delete from rmc_auth_private.delivery_processing;
delete from rmc_auth_private.delivery_attempts;
select rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'));
select ok(rmc_auth_api.finish_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',1,'RECONCILIATION_REQUIRED'),'DLQ unknown transfers to durable reconciliation');
select is((select state from rmc_auth_private.delivery_processing),'RECONCILIATION_REQUIRED','unresolved outcome remains recoverable');

rollback to current_fixture;
delete from rmc_auth_private.delivery_processing;
delete from rmc_auth_private.delivery_attempts;
select ok(not has_function_privilege('authenticated','rmc_auth_api.begin_delivery(uuid,uuid,bigint,jsonb,jsonb)','EXECUTE'),'begin denies browser role');
select ok(not has_function_privilege('anon','rmc_auth_api.claim_delivery_reconciliation(uuid)','EXECUTE'),'reconciliation denies anon');
select rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'));
select is((select state from rmc_auth_private.delivery_processing),'PREPARED','preparation does not claim external effect');
select ok(not rmc_auth_api.apply_delivery_receipt(gen_random_uuid(),'05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000005','DELIVERED',clock_timestamp()),'receipt cannot manufacture effect before begin');
select ok(not rmc_auth_api.finish_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',1,'UNKNOWN'),'pre-send failure is not ambiguous outbound');
update rmc_auth_private.delivery_processing set lease_until=clock_timestamp()-interval '1 second';
select is(rmc_auth_api.admit_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'))->>'kind','READY','expired preparation safely resumes');
select ok(not rmc_auth_api.begin_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',1,rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'),(select value->'phone' from admitted)),'old preparation fence cannot send');
update rmc_auth_private.delivery_control set enabled=false;
select ok(not rmc_auth_api.begin_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',2,rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'),(select value->'phone' from admitted)),'kill switch rechecked after preparation');
update rmc_auth_private.delivery_control set enabled=true;
select ok(not rmc_auth_api.begin_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',2,rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'),'{}'),'changed phone cannot send');
savepoint begin_generation;
update rmc_auth_private.identities set generation=2 where id='05000000-0000-4000-8000-000000000001';
select ok(not rmc_auth_api.begin_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',2,rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'),(select value->'phone' from admitted)),'generation change between decrypt and begin denies outbound');
rollback to begin_generation;
select ok(rmc_auth_api.begin_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',2,rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'),(select value->'phone' from admitted)),'fresh fenced intent begins');
select ok(not rmc_auth_api.begin_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',2,rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004'),(select value->'phone' from admitted)),'begin is not repeatable authorization');
select ok(rmc_auth_api.finish_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000007',2,'RECONCILIATION_REQUIRED'),'ambiguous effect transfers to durable reconciliation');
update rmc_auth_private.delivery_control set enabled=false;
update rmc_auth_private.delivery_processing set next_reconcile_at=clock_timestamp(),attempts=5;
create temp table recon_claim as select rmc_auth_api.claim_delivery_reconciliation('05000000-0000-4000-8000-000000000008') value;
select is(jsonb_array_length((select value from recon_claim)),1,'bookkeeping remains recoverable with kill switch off and attempts exhausted');
select is(rmc_auth_api.claim_delivery_reconciliation(gen_random_uuid()),'[]'::jsonb,'reconciliation live lease excludes duplicate');
select ok(rmc_auth_api.finish_delivery('05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000008',3,'UNKNOWN'),'unknown lookup remains retryable');
select is(jsonb_array_length(rmc_auth_api.claim_delivery_reconciliation(gen_random_uuid())),0,'reconciliation has durable backoff');
update rmc_auth_private.delivery_processing set state='DEAD';
select ok(rmc_auth_api.apply_delivery_receipt(gen_random_uuid(),'05000000-0000-4000-8000-000000000004','05000000-0000-4000-8000-000000000005','DELIVERED',clock_timestamp()),'late receipt records initiated external outcome after DEAD');
select is((select state from rmc_auth_private.delivery_processing),'DELIVERED','late evidence does not disappear');
select ok(rmc_auth_api.quarantine_delivery('synthetic-correlated','auth-delivery-dlq','DISABLED',rmc_auth_private.delivery_message('05000000-0000-4000-8000-000000000004')),'disabled DLQ persists source correlation');
select is((select outbox_id::text from rmc_auth_private.delivery_quarantine where outbox_id is not null),'05000000-0000-4000-8000-000000000004','quarantine maps valid message to durable source');
select is(jsonb_array_length(rmc_auth_api.delivery_key_inventory()),2,'key inventory includes phone and delivery references');
select * from finish();
rollback;
