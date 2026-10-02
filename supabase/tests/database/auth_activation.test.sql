begin;
set local search_path=extensions,public;
select no_plan();
select ok(not has_function_privilege('anon','rmc_auth_api.activation_candidate(integer[],bytea[])','EXECUTE'),'candidate lookup is server-only');
select ok(not has_function_privilege('authenticated','rmc_auth_api.begin_activation(uuid,uuid,bytea,bytea,bytea,bytea,integer[],bytea[],uuid,bigint,uuid,bytea,bytea,bytea,bytea,integer,uuid,bytea,integer,bytea,integer,timestamptz,uuid)','EXECUTE'),'activation write is server-only');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='rmc_auth_private.activation_requests'::regclass),'request ledger has RLS defense in depth');
select ok(not has_table_privilege('anon','rmc_auth_private.activation_requests','SELECT'),'browser cannot read ledger');
insert into rmc_auth_private.identities(id,role,provider_subject)
values('16000000-0000-4000-8000-000000000001','S','26000000-0000-4000-8000-000000000001');
insert into rmc_auth_private.command_ledger
  (command_id,idempotency_key,intent_hash,target_identity_id,command_type,state)
values('36000000-0000-4000-8000-000000000001',
  '36000000-0000-4000-8000-000000000002',decode(repeat('ad',32),'hex'),
  '16000000-0000-4000-8000-000000000001','PROVISION_IDENTITY','COMMITTED');
insert into rmc_auth_private.provider_reservations
  (command_id,identity_id,provider_subject,ownership_binding,identity_generation,
    lease_owner,lease_expires_at,state,confirmed_at)
values('36000000-0000-4000-8000-000000000001',
  '16000000-0000-4000-8000-000000000001','26000000-0000-4000-8000-000000000001',
  '36000000-0000-4000-8000-000000000003',1,
  '36000000-0000-4000-8000-000000000004',clock_timestamp()+interval '1 hour',
  'COMMITTED',clock_timestamp());
insert into rmc_auth_private.day_zero_receipt(command_id,operator_id,state)
values('36000000-0000-4000-8000-000000000001',
  '36000000-0000-4000-8000-000000000005','RESERVED');
insert into rmc_auth_private.identity_lookups(identity_id,lookup_type,key_version,lookup_hash)
values('16000000-0000-4000-8000-000000000001','CPF',1,decode(repeat('11',32),'hex'));
insert into rmc_auth_private.provisioning_phone_sources(identity_id,identity_generation,key_version,ciphertext)
values('16000000-0000-4000-8000-000000000001',1,1,decode(repeat('ab',42),'hex'));
select is(rmc_auth_api.activation_candidate(array[1],array[decode(repeat('11',32),'hex')]),
  null::jsonb,'S cannot activate before day-zero completion');
update rmc_auth_private.day_zero_receipt set state='COMPLETE',closed_at=clock_timestamp();
select is(rmc_auth_api.activation_candidate(array[1],array[decode(repeat('22',32),'hex')]),null::jsonb,'unknown CPF lookup is decoy');
select is(rmc_auth_api.activation_candidate(array[1],array[decode(repeat('11',32),'hex')])->>'identityId','16000000-0000-4000-8000-000000000001','eligible identity found privately');
select is(rmc_auth_api.activation_candidate(array[1,1],array[decode(repeat('11',32),'hex'),decode(repeat('11',32),'hex')]),null::jsonb,'duplicate lookup versions denied');
set local role service_role;
select lives_ok($$select rmc_auth_api.create_preauth_context('16000000-0000-4000-8000-000000000002',decode(repeat('31',32),'hex'),decode(repeat('32',32),'hex'),decode(repeat('33',60),'hex'),decode(repeat('34',32),'hex'),1,decode(repeat('35',32),'hex'))$$,'PREAUTH context persisted');
select lives_ok($$select rmc_auth_api.begin_activation(
  '16000000-0000-4000-8000-000000000003','16000000-0000-4000-8000-000000000002',
  decode(repeat('31',32),'hex'),decode(repeat('32',32),'hex'),decode(repeat('36',32),'hex'),decode(repeat('40',32),'hex'),
  array[1],array[decode(repeat('11',32),'hex')],
  '16000000-0000-4000-8000-000000000001',1,
  '16000000-0000-4000-8000-000000000004',decode(repeat('37',32),'hex'),decode(repeat('38',32),'hex'),
  decode(repeat('39',32),'hex'),decode(repeat('3a',60),'hex'),1,
  '16000000-0000-4000-8000-000000000005',decode(repeat('3b',32),'hex'),1,
  decode(repeat('3c',40),'hex'),1,clock_timestamp()+interval '5 minutes',
  '16000000-0000-4000-8000-000000000006')$$,'challenge and outbox committed with the restricted journey');
reset role;
select is((select count(*)::integer from rmc_auth_private.delivery_outbox where id='16000000-0000-4000-8000-000000000006'),1,'eligible request has exactly one outbox');
select is((select state::text from rmc_auth_private.journey_transactions where id='16000000-0000-4000-8000-000000000002'),'COMMITTED','parent PREAUTH consumed');
select is((select purpose::text from rmc_auth_private.journey_transactions where id='16000000-0000-4000-8000-000000000004'),'PREAUTH','new journey has no NORMAL authority');
select is((select count(*)::integer from rmc_auth_private.functional_sessions where identity_id='16000000-0000-4000-8000-000000000001'),0,'request never creates a functional session');
select is((select count(*)::integer from rmc_auth_private.audit_events where event_type='CHALLENGE_REQUESTED' and request_id='16000000-0000-4000-8000-000000000003'),1,'audit event committed with request');
set local role service_role;
select is(rmc_auth_api.replay_activation(
  '16000000-0000-4000-8000-000000000003',decode(repeat('31',32),'hex'),
  decode(repeat('32',32),'hex'),decode(repeat('36',32),'hex'))->>'challengeId',
  '16000000-0000-4000-8000-000000000005','lost response replays same challenge');
select is(rmc_auth_api.replay_activation(
  '16000000-0000-4000-8000-000000000003',decode(repeat('31',32),'hex'),
  decode(repeat('32',32),'hex'),decode(repeat('ff',32),'hex')),
  null::jsonb,'changed intent cannot recover response');
reset role;
select throws_ok($$select rmc_auth_api.begin_activation(
  '16000000-0000-4000-8000-000000000003','16000000-0000-4000-8000-000000000002',
  decode(repeat('31',32),'hex'),decode(repeat('32',32),'hex'),decode(repeat('ff',32),'hex'),decode(repeat('40',32),'hex'),
  array[1],array[decode(repeat('11',32),'hex')],
  '16000000-0000-4000-8000-000000000001',1,
  '16000000-0000-4000-8000-000000000004',decode(repeat('37',32),'hex'),decode(repeat('38',32),'hex'),
  decode(repeat('39',32),'hex'),decode(repeat('3a',60),'hex'),1,
  '16000000-0000-4000-8000-000000000005',decode(repeat('3b',32),'hex'),1,
  decode(repeat('3c',40),'hex'),1,clock_timestamp()+interval '5 minutes',
  '16000000-0000-4000-8000-000000000006')$$,'23505','AUTH_IDEMPOTENCY_CONFLICT','same command with changed intent denied');
select is((select count(*)::integer from rmc_auth_private.delivery_outbox where identity_id='16000000-0000-4000-8000-000000000001'),1,'conflicting replay has no second outbox');
set local role service_role;
select is(rmc_auth_api.read_activation_challenge(decode(repeat('37',32),'hex'),decode(repeat('39',32),'hex'),'16000000-0000-4000-8000-000000000005')->>'identityId',
  '16000000-0000-4000-8000-000000000001','restricted challenge metadata read under cookie and CSRF');
select is(rmc_auth_api.read_activation_challenge(decode(repeat('37',32),'hex'),decode(repeat('ff',32),'hex'),'16000000-0000-4000-8000-000000000005'),null::jsonb,'wrong CSRF cannot read challenge');
select ok(not rmc_auth_api.verify_activation(decode(repeat('37',32),'hex'),decode(repeat('39',32),'hex'),
  '16000000-0000-4000-8000-000000000005',decode(repeat('00',32),'hex'),
  '16000000-0000-4000-8000-000000000007',decode(repeat('41',32),'hex'),decode(repeat('42',32),'hex'),
  decode(repeat('43',60),'hex'),decode(repeat('44',32),'hex'),1,'16000000-0000-4000-8000-000000000008'),
  'wrong OTP digest is denied');
reset role;
select is((select attempt_count from rmc_auth_private.challenges where id='16000000-0000-4000-8000-000000000005'),1,'wrong attempt counted durably');
select is((select count(*)::integer from rmc_auth_private.functional_sessions where identity_id='16000000-0000-4000-8000-000000000001'),0,'wrong code creates no session');
set local role service_role;
select ok(rmc_auth_api.verify_activation(decode(repeat('37',32),'hex'),decode(repeat('39',32),'hex'),
  '16000000-0000-4000-8000-000000000005',decode(repeat('3b',32),'hex'),
  '16000000-0000-4000-8000-000000000007',decode(repeat('41',32),'hex'),decode(repeat('42',32),'hex'),
  decode(repeat('43',60),'hex'),decode(repeat('44',32),'hex'),1,'16000000-0000-4000-8000-000000000008'),
  'correct OTP creates only BOOTSTRAP');
select ok(not rmc_auth_api.verify_activation(decode(repeat('37',32),'hex'),decode(repeat('39',32),'hex'),
  '16000000-0000-4000-8000-000000000005',decode(repeat('3b',32),'hex'),
  '16000000-0000-4000-8000-000000000009',decode(repeat('51',32),'hex'),decode(repeat('52',32),'hex'),
  decode(repeat('53',60),'hex'),decode(repeat('54',32),'hex'),1,'16000000-0000-4000-8000-000000000010'),
  'replay cannot create another bootstrap');
reset role;
select is((select onboarding::text from rmc_auth_private.identities where id='16000000-0000-4000-8000-000000000001'),'PASSWORD_REQUIRED','verified SMS advances only onboarding');
select is((select purpose::text from rmc_auth_private.functional_sessions where id='16000000-0000-4000-8000-000000000007'),'BOOTSTRAP','session remains restricted');
select is((select count(*)::integer from rmc_auth_private.functional_sessions where identity_id='16000000-0000-4000-8000-000000000001' and purpose='NORMAL'),0,'no NORMAL after OTP');
select is((select count(*)::integer from rmc_auth_private.csrf_material where session_id='16000000-0000-4000-8000-000000000007' and invalidated_at is null),1,'BOOTSTRAP CSRF committed with session');
set local role service_role;
select is(rmc_auth_api.claim_activation_password(decode(repeat('41',32),'hex'),
  decode(repeat('42',32),'hex'),'16000000-0000-4000-8000-000000000016',
  decode(repeat('61',32),'hex'),'16000000-0000-4000-8000-000000000017')->>'providerSubject',
  '26000000-0000-4000-8000-000000000001','password claim is bound to owned provider user');
select is(rmc_auth_api.claim_activation_password(decode(repeat('41',32),'hex'),
  decode(repeat('42',32),'hex'),'16000000-0000-4000-8000-000000000016',
  decode(repeat('61',32),'hex'),'16000000-0000-4000-8000-000000000018')->>'busy',
  'true','concurrent password mutation is denied during lease');
select ok(rmc_auth_api.prove_activation_password(
  '16000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000007',
  '16000000-0000-4000-8000-000000000016','16000000-0000-4000-8000-000000000017',1,
  '26000000-0000-4000-8000-000000000001',decode(repeat('ac',128),'hex'),1,
  clock_timestamp()+interval '1 hour','16000000-0000-4000-8000-000000000019'),
  'proven provider password commits restricted security setup');
select is(rmc_auth_api.claim_activation_password(decode(repeat('41',32),'hex'),
  decode(repeat('42',32),'hex'),'16000000-0000-4000-8000-000000000016',
  decode(repeat('61',32),'hex'),'16000000-0000-4000-8000-000000000020')->>'proved',
  'true','lost password response replays proved state');
reset role;
select is((select onboarding::text from rmc_auth_private.identities where id='16000000-0000-4000-8000-000000000001'),
  'SECURITY_SETUP','password proof advances onboarding only');
select is((select count(*)::integer from rmc_auth_private.functional_sessions
  where identity_id='16000000-0000-4000-8000-000000000001' and purpose='NORMAL'),0,
  'password proof never creates NORMAL authority');
set local role service_role;
select is(rmc_auth_api.read_activation_security_setup(decode(repeat('41',32),'hex'),
  decode(repeat('42',32),'hex'))->>'role','S',
  'security setup read is bound to BOOTSTRAP cookie and CSRF');
select is(rmc_auth_api.complete_activation(decode(repeat('41',32),'hex'),
  decode(repeat('42',32),'hex'),'16000000-0000-4000-8000-000000000024',
  decode(repeat('62',32),'hex'),'26000000-0000-4000-8000-000000000001',null,
  'aal1',decode(repeat('ac',128),'hex'),1,clock_timestamp()+interval '1 hour',
  '16000000-0000-4000-8000-000000000024',decode(repeat('71',32),'hex'),
  decode(repeat('72',32),'hex'),decode(repeat('73',60),'hex'),decode(repeat('74',32),'hex'),1,
  '16000000-0000-4000-8000-000000000025'),null::jsonb,
  'S cannot skip mandatory TOTP');
select is(rmc_auth_api.claim_activation_totp(decode(repeat('41',32),'hex'),
  decode(repeat('42',32),'hex'),'16000000-0000-4000-8000-000000000021',
  '16000000-0000-4000-8000-000000000022')->>'claimed','true',
  'TOTP enrollment claim is exclusive');
select ok(rmc_auth_api.record_activation_totp(
  '16000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000007',
  '16000000-0000-4000-8000-000000000021','16000000-0000-4000-8000-000000000022',1,
  '16000000-0000-4000-8000-000000000023','16000000-0000-4000-8000-000000000026'),
  'factor id recorded without the TOTP secret');
reset role;
update rmc_auth_private.provisioning_phone_sources set identity_generation=2
  where identity_id='16000000-0000-4000-8000-000000000001';
set local role service_role;
select is(rmc_auth_api.complete_activation(decode(repeat('41',32),'hex'),
  decode(repeat('42',32),'hex'),'16000000-0000-4000-8000-000000000027',
  decode(repeat('63',32),'hex'),'26000000-0000-4000-8000-000000000001',
  '16000000-0000-4000-8000-000000000023','aal2',decode(repeat('ac',128),'hex'),1,
  clock_timestamp()+interval '1 hour','16000000-0000-4000-8000-000000000027',
  decode(repeat('81',32),'hex'),decode(repeat('82',32),'hex'),decode(repeat('83',60),'hex'),
  decode(repeat('84',32),'hex'),1,'16000000-0000-4000-8000-000000000028'),null::jsonb,
  'promotion denies a phone source no longer bound to the identity generation');
reset role;
update rmc_auth_private.provisioning_phone_sources set identity_generation=1
  where identity_id='16000000-0000-4000-8000-000000000001';
set local role service_role;
select is(rmc_auth_api.complete_activation(decode(repeat('41',32),'hex'),
  decode(repeat('42',32),'hex'),'16000000-0000-4000-8000-000000000024',
  decode(repeat('62',32),'hex'),'26000000-0000-4000-8000-000000000001',
  '16000000-0000-4000-8000-000000000023','aal2',decode(repeat('ac',128),'hex'),1,
  clock_timestamp()+interval '1 hour','16000000-0000-4000-8000-000000000024',
  decode(repeat('71',32),'hex'),decode(repeat('72',32),'hex'),decode(repeat('73',60),'hex'),
  decode(repeat('74',32),'hex'),1,'16000000-0000-4000-8000-000000000025')->>'role',
  'S','verified factor commits ACTIVE and NORMAL together');
select is(rmc_auth_api.replay_activation_completion(
  '16000000-0000-4000-8000-000000000024',decode(repeat('41',32),'hex'),
  decode(repeat('42',32),'hex'),decode(repeat('62',32),'hex'))->>'normalSessionId',
  '16000000-0000-4000-8000-000000000024','lost final response replays same session');
reset role;
select is((select lifecycle::text||':'||onboarding::text from rmc_auth_private.identities
  where id='16000000-0000-4000-8000-000000000001'),'ACTIVE:COMPLETE',
  'identity promotes atomically after TOTP proof');
select is((select active_superadmin_slot from rmc_auth_private.identities
  where id='16000000-0000-4000-8000-000000000001'),1::smallint,
  'first S promotion takes the guarded superadmin slot');
select is((select count(*)::integer from rmc_auth_private.functional_sessions
  where identity_id='16000000-0000-4000-8000-000000000001' and purpose='NORMAL'),1,
  'exactly one NORMAL session exists');
select is((select count(*)::integer from rmc_auth_private.activation_bootstrap
  where identity_id='16000000-0000-4000-8000-000000000001'),0,
  'BOOTSTRAP pointer consumed at promotion');
set local role service_role;
select lives_ok($$select rmc_auth_api.create_preauth_context(
  '16000000-0000-4000-8000-000000000030',decode(repeat('65',32),'hex'),
  decode(repeat('66',32),'hex'),decode(repeat('67',60),'hex'),
  decode(repeat('68',32),'hex'),1,decode(repeat('69',32),'hex'))$$,
  'fresh PREAUTH can start a bounded decoy journey');
select lives_ok($$select rmc_auth_api.begin_activation(
  '16000000-0000-4000-8000-000000000031','16000000-0000-4000-8000-000000000030',
  decode(repeat('65',32),'hex'),decode(repeat('66',32),'hex'),
  decode(repeat('70',32),'hex'),decode(repeat('71',32),'hex'),
  array[1],array[decode(repeat('22',32),'hex')],null,null,
  '16000000-0000-4000-8000-000000000032',decode(repeat('72',32),'hex'),
  decode(repeat('73',32),'hex'),decode(repeat('74',32),'hex'),
  decode(repeat('75',60),'hex'),1,'16000000-0000-4000-8000-000000000033',
  decode(repeat('76',32),'hex'),1,decode(repeat('77',40),'hex'),1,
  clock_timestamp()+interval '5 minutes','16000000-0000-4000-8000-000000000034')$$,
  'decoy challenge is persisted without delivery');
select ok(rmc_auth_api.cancel_activation(decode(repeat('72',32),'hex'),
  decode(repeat('74',32),'hex'),'16000000-0000-4000-8000-000000000035'),
  'restart cancels pending activation before a new PREAUTH');
select ok(rmc_auth_api.cancel_activation(decode(repeat('72',32),'hex'),
  decode(repeat('74',32),'hex'),'16000000-0000-4000-8000-000000000036'),
  'cancel replay is idempotent');
select is(rmc_auth_api.read_activation_challenge(decode(repeat('72',32),'hex'),
  decode(repeat('74',32),'hex'),'16000000-0000-4000-8000-000000000033'),null::jsonb,
  'cancelled challenge cannot be verified');
reset role;
update rmc_auth_private.activation_requests set created_at=clock_timestamp()-interval '3 days'
  where command_id='16000000-0000-4000-8000-000000000003';
set local role service_role;
select lives_ok($$select rmc_auth_api.cleanup_preauth_contexts()$$,
  'F03 cleanup handles the activation ledger');
reset role;
select is((select count(*)::integer from rmc_auth_private.activation_requests
  where command_id='16000000-0000-4000-8000-000000000003'),0,
  'expired idempotency ledger is released after replay window');
select * from finish();
rollback;
