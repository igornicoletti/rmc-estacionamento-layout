begin;
set local search_path = extensions, public;
select plan(23);

insert into rmc_auth_private.identities (id, role) values
  ('11111111-1111-4111-8111-111111111111', 'M'),
  ('22222222-2222-4222-8222-222222222222', 'M'),
  ('33333333-3333-4333-8333-333333333333', 'O');
update rmc_auth_private.identities set lifecycle='ACTIVE',onboarding='COMPLETE'
  where id='33333333-3333-4333-8333-333333333333';
insert into rmc_auth_private.units_state (id, source_system, external_unit_key, observed_at) values
  ('44444444-4444-4444-8444-444444444444', 'ERP', '12345', clock_timestamp());
insert into rmc_auth_private.command_ledger (command_id,idempotency_key,intent_hash,command_type)
  select id,id,decode(repeat('10',32),'hex'),'ASSIGNMENT'
  from unnest(array['55555555-5555-4555-8555-555555555555'::uuid,
    '66666666-6666-4666-8666-666666666666'::uuid,'77777777-7777-4777-8777-777777777777'::uuid]) id;
insert into rmc_auth_private.identity_lookups (identity_id, lookup_type, key_version, lookup_hash) values
  ('33333333-3333-4333-8333-333333333333', 'CPF', 1, decode(repeat('01',32),'hex'));
update rmc_auth_private.identity_lookups set is_current=false, retired_at=clock_timestamp()
  where identity_id='33333333-3333-4333-8333-333333333333' and lookup_type='CPF';
insert into rmc_auth_private.identity_lookups (identity_id, lookup_type, key_version, lookup_hash) values
  ('33333333-3333-4333-8333-333333333333', 'CPF', 2, decode(repeat('02',32),'hex'));
select is((select count(*)::integer from rmc_auth_private.identity_lookups where identity_id='33333333-3333-4333-8333-333333333333'), 2, 'rotation retains old lookup claim');
select throws_ok(
  $$insert into rmc_auth_private.identity_lookups (identity_id,lookup_type,key_version,lookup_hash) values ('22222222-2222-4222-8222-222222222222','CPF',1,decode(repeat('01',32),'hex'))$$,
  '23505', null, 'old lookup version still prevents duplicate identity');
select throws_ok(
  $$insert into rmc_auth_private.identity_lookups (identity_id,lookup_type,key_version,lookup_hash) values ('22222222-2222-4222-8222-222222222222','CPF',2,decode(repeat('02',32),'hex'))$$,
  '23505', null, 'current lookup version prevents duplicate identity');
insert into rmc_auth_private.assignments (identity_id, unit_id, role, created_by_command_id) values
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', 'M', '55555555-5555-4555-8555-555555555555');

select throws_ok(
  $$insert into rmc_auth_private.assignments (identity_id, unit_id, role, created_by_command_id) values ('22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','M','66666666-6666-4666-8666-666666666666')$$,
  '23505', null, 'only one current manager per unit');
update rmc_auth_private.identities set lifecycle='BLOCKED' where id='11111111-1111-4111-8111-111111111111';
select is((select count(*)::integer from rmc_auth_private.assignments where unit_id='44444444-4444-4444-8444-444444444444' and valid_until is null), 1, 'blocked manager keeps assignment');
select throws_ok(
  $$insert into rmc_auth_private.assignments (identity_id, unit_id, role, created_by_command_id) values ('11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','O','77777777-7777-4777-8777-777777777777')$$,
  '23514', 'AUTH_ASSIGNMENT_ROLE_CONFLICT', 'assignment cannot contradict current identity role');
update rmc_auth_private.assignments set valid_until=clock_timestamp(),
  ended_by_command_id='66666666-6666-4666-8666-666666666666';
insert into rmc_auth_private.assignments (identity_id,unit_id,role,created_by_command_id) values
  ('22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','M',
    '77777777-7777-4777-8777-777777777777');
select is((select count(*)::integer from rmc_auth_private.assignments),2,'replacement preserves assignment history');
select is((select count(*)::integer from rmc_auth_private.assignments where valid_until is null),1,'replacement has exactly one current manager');
select throws_ok($$update rmc_auth_private.assignments set valid_until=null,ended_by_command_id=null where valid_until is not null$$,
  '23514','AUTH_ASSIGNMENT_HISTORY_IMMUTABLE','closed assignment cannot be reopened');
select throws_ok($$update rmc_auth_private.identities set role='O' where id='22222222-2222-4222-8222-222222222222'$$,
  '23514','AUTH_ASSIGNMENT_ROLE_CONFLICT','role change requires ending current assignment first');
select throws_ok($$insert into rmc_auth_private.assignments (identity_id,unit_id,role,created_by_command_id)
  values ('22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','M',
    '77777777-7777-4777-8777-777777777777')$$,'23505',null,'same identity cannot acquire two current assignments');

insert into rmc_auth_private.functional_sessions (id,identity_id,purpose,assurance,cookie_hash,key_version,generation,expires_at,idle_expires_at) values
 ('88888888-8888-4888-8888-888888888888','33333333-3333-4333-8333-333333333333','NORMAL','aal2',decode(repeat('aa',32),'hex'),1,1,now()+interval '1 hour',now()+interval '30 minute');
select throws_ok(
  $$insert into rmc_auth_private.functional_sessions (identity_id,purpose,assurance,cookie_hash,key_version,generation,expires_at,idle_expires_at) values ('33333333-3333-4333-8333-333333333333','NORMAL','aal2',decode(repeat('bb',32),'hex'),1,2,now()+interval '1 hour',now()+interval '30 minute')$$,
  '23505', null, 'one active NORMAL session per identity');

insert into rmc_auth_private.journey_transactions (id,identity_id,purpose,binding_hash,secret_hash,key_version,state,expires_at) values
 ('99999999-9999-4999-8999-999999999999','33333333-3333-4333-8333-333333333333','PREAUTH',decode(repeat('ff',32),'hex'),decode(repeat('cc',32),'hex'),1,'PENDING',now()+interval '10 minute');
insert into rmc_auth_private.challenges (id,journey_id,identity_id,purpose,verifier_hash,ciphertext,key_version,binding_hash,generation,max_attempts,expires_at) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','99999999-9999-4999-8999-999999999999','33333333-3333-4333-8333-333333333333','PREAUTH',decode(repeat('dd',32),'hex'),decode(repeat('ee',48),'hex'),1,decode(repeat('ff',32),'hex'),1,5,now()+interval '5 minute');
select ok(rmc_auth_api.consume_challenge('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1), 'challenge consumed once');
select ok(not rmc_auth_api.consume_challenge('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1), 'second consumption denied');
select ok(not rmc_auth_api.consume_challenge('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0), 'stale generation denied');

select is((rmc_auth_api.claim_command('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','cccccccc-cccc-4ccc-8ccc-cccccccccccc',decode(repeat('11',32),'hex'),'PROVISION')->>'state'), 'CLAIMED', 'command claimed');
select is((rmc_auth_api.claim_command('dddddddd-dddd-4ddd-8ddd-dddddddddddd','cccccccc-cccc-4ccc-8ccc-cccccccccccc',decode(repeat('11',32),'hex'),'PROVISION')->>'commandId'), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'same intent returns persisted result');
select throws_ok(
  $$select rmc_auth_api.claim_command('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','cccccccc-cccc-4ccc-8ccc-cccccccccccc',decode(repeat('22',32),'hex'),'PROVISION')$$,
  '23505', 'AUTH_IDEMPOTENCY_CONFLICT', 'different intent conflicts');

select is((select acquired from rmc_auth_api.acquire_refresh_lease('88888888-8888-4888-8888-888888888888','ffffffff-ffff-4fff-8fff-ffffffffffff',1,5)), true, 'first lease acquired');
select is((select acquired from rmc_auth_api.acquire_refresh_lease('88888888-8888-4888-8888-888888888888','12121212-1212-4212-8212-121212121212',1,5)), false, 'concurrent lease denied');
update rmc_auth_private.refresh_leases set expires_at=clock_timestamp()-interval '1 second',
  acquired_at=clock_timestamp()-interval '6 seconds',fencing_token=fencing_token+1;
select is((select acquired from rmc_auth_api.acquire_refresh_lease('88888888-8888-4888-8888-888888888888','12121212-1212-4212-8212-121212121212',1,5)), true, 'expired lease can be reacquired');
select is((select fencing_token from rmc_auth_private.refresh_leases where session_id='88888888-8888-4888-8888-888888888888'), 3::bigint, 'fencing token advances monotonically');
select throws_ok(
  $$update rmc_auth_private.functional_sessions set generation=0 where id='88888888-8888-4888-8888-888888888888'$$,
  '23514', 'AUTH_GENERATION_REGRESSION', 'generation regression fails closed');

select * from finish();
rollback;
