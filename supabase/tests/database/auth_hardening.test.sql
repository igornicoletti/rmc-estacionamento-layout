begin;
set local search_path=extensions,public;
select no_plan();

insert into rmc_auth_private.identities (id,role,lifecycle,onboarding) values
  ('01000000-0000-4000-8000-000000000001','O','ACTIVE','COMPLETE');
insert into rmc_auth_private.journey_transactions
  (id,identity_id,purpose,binding_hash,secret_hash,key_version,state,expires_at) values
  ('02000000-0000-4000-8000-000000000001','01000000-0000-4000-8000-000000000001','PREAUTH',
    decode(repeat('01',32),'hex'),decode(repeat('02',32),'hex'),1,'PENDING',now()+interval '10 minutes');

create function pg_temp.challenge(test_generation bigint default 1, test_attempts integer default 0)
returns uuid language plpgsql as $$
declare challenge_id uuid := gen_random_uuid();
begin
  insert into rmc_auth_private.challenges
    (id,journey_id,identity_id,purpose,binding_hash,verifier_hash,ciphertext,key_version,generation,
      max_attempts,attempt_count,expires_at)
    values (challenge_id,'02000000-0000-4000-8000-000000000001','01000000-0000-4000-8000-000000000001',
      'PREAUTH',decode(repeat('01',32),'hex'),decode(repeat('03',32),'hex'),decode(repeat('04',48),'hex'),
      1,test_generation,5,test_attempts,now()+interval '5 minutes');
  return challenge_id;
end;
$$;

select ok(not rmc_auth_api.consume_challenge(null,1),'null challenge is denied');
select ok(not rmc_auth_api.consume_challenge(gen_random_uuid(),1),'unknown challenge is denied');
select ok(not rmc_auth_api.consume_challenge(pg_temp.challenge(2),2),'journey generation mismatch is denied');
select ok(not rmc_auth_api.consume_challenge(pg_temp.challenge(1,5),1),'exhausted budget is denied');
create temporary table consumed_fixture as select pg_temp.challenge() id;
select ok(rmc_auth_api.consume_challenge((select id from consumed_fixture),1),'valid bound challenge is consumed');
select throws_ok($$update rmc_auth_private.challenges set consumed_at=null where id=(select id from consumed_fixture)$$,
  '23514','AUTH_CHALLENGE_IMMUTABLE','consumed challenge cannot be reopened');
create temporary table budget_fixture as select pg_temp.challenge(1,2) id;
select throws_ok($$update rmc_auth_private.challenges set attempt_count=1 where id=(select id from budget_fixture)$$,
  '23514','AUTH_CHALLENGE_IMMUTABLE','attempt budget cannot be reset');

insert into rmc_auth_private.challenges
  (id,journey_id,identity_id,purpose,binding_hash,verifier_hash,ciphertext,key_version,generation,
    max_attempts,created_at,expires_at) values
  ('03000000-0000-4000-8000-000000000001','02000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000001','PREAUTH',decode(repeat('01',32),'hex'),
    decode(repeat('03',32),'hex'),decode(repeat('04',48),'hex'),1,1,5,
    now()-interval '10 minutes',now()-interval '1 minute');
select ok(not rmc_auth_api.consume_challenge('03000000-0000-4000-8000-000000000001',1),
  'expired challenge is denied with database clock');
select is(to_regprocedure('rmc_auth_api.consume_challenge(uuid,bigint,timestamptz)'),null::regprocedure,
  'no caller-clock overload survives');

select throws_ok($$select rmc_auth_api.claim_command(gen_random_uuid(),gen_random_uuid(),null,'PROVISION')$$,
  '22023','AUTH_COMMAND_INVALID','null intent denied explicitly');
select throws_ok($$select rmc_auth_api.claim_command(gen_random_uuid(),gen_random_uuid(),decode('01','hex'),'PROVISION')$$,
  '22023','AUTH_COMMAND_INVALID','short intent denied explicitly');
select throws_ok($$select rmc_auth_api.claim_command(gen_random_uuid(),gen_random_uuid(),decode(repeat('01',32),'hex'),' ')$$,
  '22023','AUTH_COMMAND_INVALID','unbounded/free-form command type denied');
select throws_ok($$insert into rmc_auth_private.identities (id,role) values ('00000000-0000-1000-8000-000000000001','O')$$,
  '23514',null,'RMC UUID must be v4');
insert into rmc_auth_private.identities (role,lifecycle,onboarding,active_superadmin_slot)
  values ('S','ACTIVE','COMPLETE',1),('S','ACTIVE','COMPLETE',2);
select throws_ok($$insert into rmc_auth_private.identities (role,lifecycle,onboarding,active_superadmin_slot)
  values ('S','ACTIVE','COMPLETE',1)$$,'23505',null,'third active superadmin cannot occupy an existing slot');
select throws_ok($$insert into rmc_auth_private.identities (role,lifecycle,onboarding,active_superadmin_slot)
  values ('S','ACTIVE','COMPLETE',3)$$,'23514',null,'third active superadmin cannot invent another slot');
select throws_ok($$insert into rmc_auth_private.identity_lookups
  (identity_id,lookup_type,key_version,lookup_hash) values ('01000000-0000-4000-8000-000000000001','CPF',1,decode('01','hex'))$$,
  '23514',null,'short lookup HMAC denied');

select lives_ok($$select rmc_auth_api.claim_command('04000000-0000-4000-8000-000000000001',
  '04000000-0000-4000-8000-000000000002',decode(repeat('01',32),'hex'),'PROVISION')$$,'durable command created');
select throws_ok($$select rmc_auth_api.claim_command(gen_random_uuid(),'04000000-0000-4000-8000-000000000002',
  decode(repeat('01',32),'hex'),'PROVISION','01000000-0000-4000-8000-000000000001')$$,
  '23505','AUTH_IDEMPOTENCY_CONFLICT','same hash with changed actor conflicts');
select throws_ok($$select rmc_auth_api.claim_command(gen_random_uuid(),'04000000-0000-4000-8000-000000000002',
  decode(repeat('01',32),'hex'),'PROVISION',null,'01000000-0000-4000-8000-000000000001')$$,
  '23505','AUTH_IDEMPOTENCY_CONFLICT','same hash with changed target conflicts');
select throws_ok($$update rmc_auth_private.command_ledger set intent_hash=decode(repeat('02',32),'hex')$$,
  '23514','AUTH_COMMAND_INTENT_IMMUTABLE','claimed intent is immutable');
select throws_ok($$update rmc_auth_private.command_ledger set state='COMMITTED'$$,
  '23514','AUTH_COMMAND_TRANSITION_DENIED','cannot skip evidence of external outcome');
select throws_ok($$update rmc_auth_private.command_ledger set result_payload='{"otp":"12345678"}'::jsonb$$,
  '23514',null,'ledger rejects free result body containing synthetic credential');
update rmc_auth_private.command_ledger set state='FAILED_CONFIRMED';
select throws_ok($$update rmc_auth_private.command_ledger set state='CLAIMED'$$,
  '23514','AUTH_COMMAND_TRANSITION_DENIED','terminal command cannot repeat side effect');

insert into rmc_auth_private.functional_sessions
  (id,identity_id,purpose,assurance,cookie_hash,key_version,generation,expires_at,idle_expires_at) values
  ('05000000-0000-4000-8000-000000000001','01000000-0000-4000-8000-000000000001','NORMAL','aal2',
    decode(repeat('05',32),'hex'),1,1,now()+interval '1 hour',now()+interval '30 minutes');
select throws_ok($$select * from rmc_auth_api.acquire_refresh_lease(
  '05000000-0000-4000-8000-000000000001',gen_random_uuid(),1,null)$$,
  '22023','AUTH_LEASE_ARGUMENT_INVALID','null duration denied');
select is((select acquired from rmc_auth_api.acquire_refresh_lease(
  '05000000-0000-4000-8000-000000000001',gen_random_uuid(),2,5)),false,'wrong session generation denied');
update rmc_auth_private.identities set generation=2 where id='01000000-0000-4000-8000-000000000001';
select ok(not rmc_auth_api.consume_challenge(pg_temp.challenge(),1),'identity fence denies previous journey generation');
select is((select acquired from rmc_auth_api.acquire_refresh_lease(
  '05000000-0000-4000-8000-000000000001',gen_random_uuid(),1,5)),false,'identity fence denies old session');
update rmc_auth_private.functional_sessions set generation=2,identity_generation=2;
update rmc_auth_private.identities set lifecycle='BLOCKED' where id='01000000-0000-4000-8000-000000000001';
select is((select acquired from rmc_auth_api.acquire_refresh_lease(
  '05000000-0000-4000-8000-000000000001',gen_random_uuid(),2,5)),false,'blocked identity denied');
select ok(not rmc_auth_api.consume_challenge(pg_temp.challenge(),1),'blocked identity cannot consume challenge');
update rmc_auth_private.identities set lifecycle='ACTIVE' where id='01000000-0000-4000-8000-000000000001';
select is((select acquired from rmc_auth_api.acquire_refresh_lease(
  '05000000-0000-4000-8000-000000000001',gen_random_uuid(),2,5)),true,'current valid identity/session acquires lease');
select throws_ok($$update rmc_auth_private.refresh_leases set fencing_token=fencing_token-1$$,
  '23514','AUTH_LEASE_FENCE_INVALID','fencing token cannot regress');
select throws_ok($$update rmc_auth_private.functional_sessions set expires_at=expires_at+interval '1 hour'$$,
  '23514','AUTH_SESSION_IMMUTABLE','absolute expiry cannot be extended');
update rmc_auth_private.functional_sessions set revoked_at=clock_timestamp();
select is((select acquired from rmc_auth_api.acquire_refresh_lease(
  '05000000-0000-4000-8000-000000000001',gen_random_uuid(),2,5)),false,'revoked session denied even before lease expiry');
select throws_ok($$update rmc_auth_private.functional_sessions set revoked_at=null$$,
  '23514','AUTH_SESSION_IMMUTABLE','revoked session cannot be resurrected');

create function pg_temp.lease_denied(test_purpose rmc_auth_private.authority_purpose, test_expiry timestamptz, test_idle timestamptz)
returns boolean language plpgsql as $$
declare identity_id uuid:=gen_random_uuid(); session_id uuid:=gen_random_uuid(); denied boolean;
begin
  insert into rmc_auth_private.identities (id,role,lifecycle,onboarding) values (identity_id,'O','ACTIVE','COMPLETE');
  insert into rmc_auth_private.functional_sessions
    (id,identity_id,purpose,assurance,cookie_hash,key_version,generation,created_at,expires_at,idle_expires_at)
    values (session_id,identity_id,test_purpose,'aal1',decode(md5(session_id::text)||md5(identity_id::text),'hex'),
      1,1,now()-interval '1 day',test_expiry,test_idle);
  select not acquired into denied from rmc_auth_api.acquire_refresh_lease(session_id,gen_random_uuid(),1,5);
  return denied;
end;
$$;
select ok(pg_temp.lease_denied('NORMAL',now()-interval '1 minute',now()-interval '2 minutes'),'absolute-expired session denied');
select ok(pg_temp.lease_denied('NORMAL',now()+interval '1 hour',now()-interval '1 minute'),'idle-expired session denied');
select ok(pg_temp.lease_denied('RECOVERY',now()+interval '1 hour',now()+interval '30 minutes'),'restricted authority denied refresh lease');

update rmc_auth_private.journey_transactions set identity_generation=2;
select lives_ok($$select rmc_auth_api.create_delivery_challenge(
  '06000000-0000-4000-8000-000000000001','02000000-0000-4000-8000-000000000001',1,
  decode(repeat('06',32),'hex'),decode(repeat('07',48),'hex'),1,clock_timestamp()+interval '5 minutes',5,
  '06000000-0000-4000-8000-000000000002',decode(repeat('08',48),'hex'),1,
  '06000000-0000-4000-8000-000000000003')$$,'challenge and encrypted outbox commit together');
select is((select count(*)::integer from rmc_auth_private.delivery_outbox
  where challenge_id='06000000-0000-4000-8000-000000000001'),1,'one committed outbox per challenge');
select throws_ok($$select rmc_auth_api.create_delivery_challenge(
  '06000000-0000-4000-8000-000000000004','02000000-0000-4000-8000-000000000001',1,
  decode(repeat('06',32),'hex'),decode(repeat('07',48),'hex'),1,clock_timestamp()+interval '5 minutes',5,
  '06000000-0000-4000-8000-000000000005',decode('08','hex'),1,
  '06000000-0000-4000-8000-000000000006')$$,'23514',null,'invalid outbox rolls back entire RPC');
select is((select count(*)::integer from rmc_auth_private.challenges
  where id='06000000-0000-4000-8000-000000000004'),0,'outbox failure leaves no orphan challenge');
select throws_ok($$update rmc_auth_private.delivery_outbox set binding_hash=decode(repeat('09',32),'hex')$$,
  '23514','AUTH_DELIVERY_BINDING_IMMUTABLE','outbox binding cannot diverge from challenge');
select throws_ok($$insert into rmc_auth_private.delivery_outbox
  (challenge_id,identity_id,purpose,envelope_ciphertext,key_version,binding_hash,idempotency_key,generation,max_attempts)
  select (select id from budget_fixture),null,'PREAUTH',decode(repeat('09',48),'hex'),1,
    decode(repeat('01',32),'hex'),gen_random_uuid(),1,5$$,
  '23514','AUTH_IDENTITY_BINDING_INVALID','NULL decoy cannot target a real identity challenge');
select throws_ok($$insert into rmc_auth_private.audit_events
  (event_type,request_id,outcome,reason_code,deployment_id)
  values ('DELIVERY_OUTCOME','synthetic_request','SUCCESS','SYNTHETIC_PASSWORD_123','test')$$,
  '23514',null,'audit reason is a closed code, not a credential or free body');

insert into rmc_auth_private.units_state (id,source_system,external_unit_key,observed_at,source_is_active)
  values ('07000000-0000-4000-8000-000000000001','SYNTHETIC','00123',clock_timestamp(),true);
select is((select is_eligible from rmc_auth_private.units_state),false,'local override defaults closed');
update rmc_auth_private.units_state set source_is_active=false;
update rmc_auth_private.units_state set source_is_active=true;
select is((select is_eligible from rmc_auth_private.units_state),false,'source synchronization preserves local disabled override');

update rmc_auth_private.journey_transactions set state='CANCELLED';
select ok(not rmc_auth_api.consume_challenge(pg_temp.challenge(),1),'cancelled journey is denied');
select throws_ok($$update rmc_auth_private.journey_transactions set state='PENDING'$$,
  '23514','AUTH_JOURNEY_IMMUTABLE','terminal journey cannot be reopened');

-- Exercise roles instead of inspecting ACL metadata only.
set local role anon;
select extensions.throws_ok($$select * from rmc_auth_private.identities$$,'42501',null,'anon direct access actually denied');
select extensions.throws_ok($$select rmc_auth_api.consume_challenge(gen_random_uuid(),1)$$,'42501',null,'anon RPC actually denied');
reset role;
set local role authenticated;
select extensions.throws_ok($$select * from rmc_auth_private.identities$$,'42501',null,'authenticated direct access actually denied');
select extensions.throws_ok($$select rmc_auth_api.consume_challenge(gen_random_uuid(),1)$$,'42501',null,'authenticated RPC actually denied');
reset role;
set local role service_role;
select extensions.lives_ok($$select * from rmc_auth_private.identities$$,'invoker can read required relation');
select extensions.throws_ok($$update rmc_auth_private.identities set role='S'$$,'42501',null,'service role cannot mutate identity role');
select extensions.throws_ok($$update rmc_auth_private.functional_sessions set revoked_at=null$$,'42501',null,'service role cannot resurrect session directly');
select extensions.throws_ok($$update rmc_auth_private.audit_events set outcome='SUCCESS'$$,'42501',null,'service role cannot rewrite audit');
select extensions.throws_ok($$delete from rmc_auth_private.refresh_leases$$,'42501',null,'service role cannot reset fence by deleting lease');
select extensions.throws_ok($$select * from rmc_auth_private.assignments$$,'42501',null,'unimplemented assignment RPC has no broad grants');
reset role;

select * from finish();
rollback;
