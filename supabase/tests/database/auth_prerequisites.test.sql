begin;
set local search_path=extensions,public;
select no_plan();
insert into rmc_auth_private.identities(id,role) values
  ('71000000-0000-4000-8000-000000000001','R'),
  ('71000000-0000-4000-8000-000000000002','R');

select has_table('rmc_auth_private','cpf_sources','recoverable private source exists');
select has_table('rmc_auth_private','provider_reservations','ownership reservation exists');
select ok(not has_table_privilege('anon','rmc_auth_private.cpf_sources','SELECT'),'anon cannot read CPF envelope');
select ok(not has_table_privilege('authenticated','rmc_auth_private.provider_reservations','SELECT'),'browser cannot read ownership');
select ok(not has_function_privilege('service_role','rmc_auth_api.begin_cpf_rotation(bigint,integer)','EXECUTE'),'rotation is administrative only');
select ok(not has_function_privilege('anon','rmc_auth_api.reserve_provider(uuid,bigint,uuid)','EXECUTE'),'anon cannot reserve');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='rmc_auth_api' and p.prosecdef),0,'no definer exception added');

select is(rmc_auth_api.write_cpf_source('71000000-0000-4000-8000-000000000001',1,1,0,1,
  decode(repeat('11',39),'hex'),array[1],array[decode(repeat('21',32),'hex')]),1::bigint,'initial envelope and lookup atomic');
select throws_ok($$select rmc_auth_api.write_cpf_source('71000000-0000-4000-8000-000000000001',1,1,0,1,
  decode(repeat('11',39),'hex'),array[1],array[decode(repeat('21',32),'hex')])$$,'40001','AUTH_CPF_STALE_REVISION','CAS prevents lost source update');
select throws_ok($$select rmc_auth_api.write_cpf_source('71000000-0000-4000-8000-000000000002',1,1,0,1,
  decode(repeat('11',39),'hex'),array[1],array[decode(repeat('21',32),'hex')])$$,
  '23505',null,'equivalent CPF cannot create second identity');
select is((select count(*)::integer from rmc_auth_private.cpf_sources),1,'failed duplicate leaves no envelope');
select throws_ok($$update rmc_auth_private.cpf_sources set revision=revision where identity_id='71000000-0000-4000-8000-000000000001'$$,
  '23514','AUTH_CPF_SOURCE_IMMUTABLE','direct update cannot skip CAS revision');
select is(rmc_auth_api.begin_cpf_rotation(1,2),2::bigint,'rotation enters dual-write');
select throws_ok($$select rmc_auth_api.finish_cpf_rotation(2)$$,'22023','AUTH_CPF_BACKFILL_INCOMPLETE','cutover needs full backfill');
select throws_ok($$select rmc_auth_api.write_cpf_source('71000000-0000-4000-8000-000000000002',1,2,0,1,
  decode(repeat('12',39),'hex'),array[2],array[decode(repeat('22',32),'hex')])$$,
  '22023','AUTH_CPF_INPUT_INVALID','new-key-only write forbidden');
select is(rmc_auth_api.write_cpf_source('71000000-0000-4000-8000-000000000001',1,2,1,1,
  decode(repeat('11',39),'hex'),array[1,2],array[decode(repeat('21',32),'hex'),decode(repeat('22',32),'hex')]),2::bigint,'backfill stores both versions');
select throws_ok($$select rmc_auth_api.write_cpf_source('71000000-0000-4000-8000-000000000002',1,2,0,1,
  decode(repeat('11',39),'hex'),array[1,2],array[decode(repeat('21',32),'hex'),decode(repeat('22',32),'hex')])$$,
  '23505',null,'duplicate still denied while rotating');
select is(rmc_auth_api.finish_cpf_rotation(2),3::bigint,'cutover atomic after coverage');
select is((select key_version from rmc_auth_private.identity_lookups where is_current and lookup_type='CPF'),2,'current lookup now version two');
select throws_ok($$update rmc_auth_private.identity_lookups set is_current=true,retired_at=null
  where lookup_type='CPF' and key_version=1$$,'23514','AUTH_LOOKUP_IMMUTABLE','retired alias cannot be reactivated');
select is(rmc_auth_api.begin_cpf_rotation(3,3),4::bigint,'next rotation begins');
select is(rmc_auth_api.finish_cpf_rotation(4,true),5::bigint,'rollback advances fence without dropping old hashes');
select is((select active_version from rmc_auth_private.cpf_lookup_policy),2,'rollback retains active version');
select throws_ok($$select rmc_auth_api.write_cpf_source('71000000-0000-4000-8000-000000000001',1,4,2,1,
  decode(repeat('11',39),'hex'),array[2],array[decode(repeat('22',32),'hex')])$$,
  '22023','AUTH_CPF_INPUT_INVALID','stale rotation fence denied');

select rmc_auth_api.claim_command('72000000-0000-4000-8000-000000000001','72000000-0000-4000-8000-000000000002',
  decode(repeat('31',32),'hex'),'PROVISION_IDENTITY',null,'71000000-0000-4000-8000-000000000001');
set local role service_role;
create temporary table reservation as select * from rmc_auth_api.reserve_provider('72000000-0000-4000-8000-000000000001',1,
  '73000000-0000-4000-8000-000000000001');
select is((select count(*)::integer from reservation),1,'service invoker grants allow reservation');
select is((rmc_auth_api.reserve_provider('72000000-0000-4000-8000-000000000001',1,
  '73000000-0000-4000-8000-000000000002')).provider_subject,(select provider_subject from reservation),'retry retains reserved UUID and owner');
select ok(not rmc_auth_api.commit_provider_reservation('72000000-0000-4000-8000-000000000001',
  '73000000-0000-4000-8000-000000000001',1,gen_random_uuid(),'LOCAL'),'unconfirmed cannot commit');
select ok(not rmc_auth_api.record_provider_outcome('72000000-0000-4000-8000-000000000001',
  '73000000-0000-4000-8000-000000000001',1,gen_random_uuid(),(select ownership_binding from reservation),'OWNED'),'cannot adopt another UUID');
select ok(rmc_auth_api.record_provider_outcome('72000000-0000-4000-8000-000000000001',
  '73000000-0000-4000-8000-000000000001',1,(select provider_subject from reservation),(select ownership_binding from reservation),'UNKNOWN'),'unknown is durable, not absence');
select is((select state::text from rmc_auth_private.command_ledger where command_id='72000000-0000-4000-8000-000000000001'),'RECONCILIATION_REQUIRED','ledger records unknown');
select ok(rmc_auth_api.record_provider_outcome('72000000-0000-4000-8000-000000000001',
  '73000000-0000-4000-8000-000000000001',1,(select provider_subject from reservation),(select ownership_binding from reservation),'OWNED'),'exact owned proof confirmed');
select ok(not rmc_auth_api.record_provider_outcome('72000000-0000-4000-8000-000000000001',
  '73000000-0000-4000-8000-000000000001',1,(select provider_subject from reservation),(select ownership_binding from reservation),'ABSENT'),'owned cannot be aborted as absent');
select ok(rmc_auth_api.commit_provider_reservation('72000000-0000-4000-8000-000000000001',
  '73000000-0000-4000-8000-000000000001',1,gen_random_uuid(),'LOCAL'),'association and audit commit');
reset role;
select is((select lifecycle::text from rmc_auth_private.identities where id='71000000-0000-4000-8000-000000000001'),'PENDING','commit does not promote');
select is((select count(*)::integer from rmc_auth_private.audit_events where command_id='72000000-0000-4000-8000-000000000001'),1,'one audit event');
select is((select count(*)::integer from rmc_auth_private.audit_outbox),1,'durable audit outbox committed');
select ok(rmc_auth_api.commit_provider_reservation('72000000-0000-4000-8000-000000000001',
  '73000000-0000-4000-8000-000000000001',1,gen_random_uuid(),'LOCAL'),'idempotent committed result');
select is((select count(*)::integer from rmc_auth_private.audit_outbox),1,'retry does not duplicate audit');

select throws_ok($$update rmc_auth_private.provider_reservations set provider_subject=gen_random_uuid()
  where command_id='72000000-0000-4000-8000-000000000001'$$,'23514','AUTH_PROVISION_IMMUTABLE','owned UUID cannot change');
select is((rmc_auth_api.read_cpf_source('71000000-0000-4000-8000-000000000001',1)).revision,2::bigint,'bounded source read');
select ok((rmc_auth_api.read_cpf_source('71000000-0000-4000-8000-000000000001',2)).identity_id is null,'source read rejects stale identity generation');

-- Fault injection: audit failure rolls back identity, ledger and reservation together.
select is(rmc_auth_api.write_cpf_source('71000000-0000-4000-8000-000000000002',1,5,0,1,
  decode(repeat('41',39),'hex'),array[2],array[decode(repeat('42',32),'hex')]),1::bigint,'second independent synthetic source');
select rmc_auth_api.claim_command('72000000-0000-4000-8000-000000000003','72000000-0000-4000-8000-000000000004',
  decode(repeat('51',32),'hex'),'PROVISION_IDENTITY',null,'71000000-0000-4000-8000-000000000002');
create temporary table reservation_two as select * from rmc_auth_api.reserve_provider('72000000-0000-4000-8000-000000000003',1,
  '73000000-0000-4000-8000-000000000001');
select ok(rmc_auth_api.record_provider_outcome('72000000-0000-4000-8000-000000000003','73000000-0000-4000-8000-000000000001',
  1,(select provider_subject from reservation_two),(select ownership_binding from reservation_two),'OWNED'),'second proof confirmed');
create function pg_temp.fail_audit() returns trigger language plpgsql as $$begin raise exception using errcode='23514',message='SYNTHETIC_AUDIT_FAILURE'; end$$;
create trigger synthetic_audit_failure before insert on rmc_auth_private.audit_events for each row execute function pg_temp.fail_audit();
select throws_ok($$select rmc_auth_api.commit_provider_reservation('72000000-0000-4000-8000-000000000003',
  '73000000-0000-4000-8000-000000000001',1,gen_random_uuid(),'LOCAL')$$,'23514','SYNTHETIC_AUDIT_FAILURE','audit failure aborts commit');
select ok((select provider_subject is null from rmc_auth_private.identities where id='71000000-0000-4000-8000-000000000002'),'failed audit leaves identity unassociated');
select is((select state from rmc_auth_private.provider_reservations where command_id='72000000-0000-4000-8000-000000000003'),'CONFIRMED','failed audit leaves reservation uncommitted');
select is((select state::text from rmc_auth_private.command_ledger where command_id='72000000-0000-4000-8000-000000000003'),'EFFECT_CONFIRMED','failed audit leaves ledger uncommitted');
drop trigger synthetic_audit_failure on rmc_auth_private.audit_events;
update rmc_auth_private.identities set generation=2 where id='71000000-0000-4000-8000-000000000002';
select ok(not rmc_auth_api.commit_provider_reservation('72000000-0000-4000-8000-000000000003',
  '73000000-0000-4000-8000-000000000001',1,gen_random_uuid(),'LOCAL'),'changed identity generation cannot commit');

insert into rmc_auth_private.identities(id,role) values('71000000-0000-4000-8000-000000000003','R');
select is(rmc_auth_api.write_cpf_source('71000000-0000-4000-8000-000000000003',1,5,0,1,
  decode(repeat('61',39),'hex'),array[2],array[decode(repeat('62',32),'hex')]),1::bigint,'independent source for confirmed absence');
select rmc_auth_api.claim_command('72000000-0000-4000-8000-000000000005','72000000-0000-4000-8000-000000000006',
  decode(repeat('63',32),'hex'),'PROVISION_IDENTITY',null,'71000000-0000-4000-8000-000000000003');
create temporary table absent_reservation as select * from rmc_auth_api.reserve_provider('72000000-0000-4000-8000-000000000005',1,
  '73000000-0000-4000-8000-000000000001');
select ok(rmc_auth_api.record_provider_outcome('72000000-0000-4000-8000-000000000005','73000000-0000-4000-8000-000000000001',
  1,(select provider_subject from absent_reservation),(select ownership_binding from absent_reservation),'ABSENT'),'proven absence aborts only unconfirmed reservation');
select rmc_auth_api.claim_command('72000000-0000-4000-8000-000000000007','72000000-0000-4000-8000-000000000008',
  decode(repeat('64',32),'hex'),'PROVISION_IDENTITY',null,'71000000-0000-4000-8000-000000000003');
select isnt((rmc_auth_api.reserve_provider('72000000-0000-4000-8000-000000000007',1,
  '73000000-0000-4000-8000-000000000001')).provider_subject,(select provider_subject from absent_reservation),'new command after confirmed absence gets fresh UUID');
select is((select count(*)::integer from rmc_auth_private.provider_reservations where identity_id='71000000-0000-4000-8000-000000000003'),2,'aborted ownership history preserved');

select * from finish();
rollback;
