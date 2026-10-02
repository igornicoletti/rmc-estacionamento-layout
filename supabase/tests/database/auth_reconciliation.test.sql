begin;
select plan(14);
insert into rmc_auth_private.identities(id,role) values ('03000000-0000-4000-8000-000000000001','R');
select rmc_auth_api.write_cpf_source('03000000-0000-4000-8000-000000000001',1,1,0,1,
  decode(repeat('91',39),'hex'),array[1],array[decode(repeat('92',32),'hex')]);
select rmc_auth_api.claim_command('03000000-0000-4000-8000-000000000002','03000000-0000-4000-8000-000000000003',
  decode(repeat('93',32),'hex'),'PROVISION_IDENTITY',null,'03000000-0000-4000-8000-000000000001');
select rmc_auth_api.reserve_provider('03000000-0000-4000-8000-000000000002',1,'03000000-0000-4000-8000-000000000004');
-- Only synthetic fixture expiry; no wall-clock sleeps or changed production clock.
update rmc_auth_private.provider_reservations set fence=fence+1,lease_expires_at=clock_timestamp()-interval '1 second';
set local role service_role;
select ok((rmc_auth_api.claim_provider_reconciliation('03000000-0000-4000-8000-000000000002',
  '03000000-0000-4000-8000-000000000005')).command_id is not null,'expired lease can be claimed');
select is(reconcile_attempts,1,'claim consumes one durable attempt') from rmc_auth_private.provider_reservations;
select ok(next_reconcile_at>clock_timestamp()+interval '50 seconds','first backoff persisted') from rmc_auth_private.provider_reservations;
select ok((rmc_auth_api.claim_provider_reconciliation('03000000-0000-4000-8000-000000000002',
  '03000000-0000-4000-8000-000000000006')).command_id is null,'live lease denies second claimant');
select throws_ok($$update rmc_auth_private.provider_reservations set reconcile_attempts=0$$,
  '23514','AUTH_RECONCILE_BUDGET_IMMUTABLE','cannot reset attempts');
select throws_ok($$update rmc_auth_private.provider_reservations set next_reconcile_at=clock_timestamp()-interval '1 hour'$$,
  '23514','AUTH_RECONCILE_BUDGET_IMMUTABLE','cannot rewind backoff');
reset role;
select throws_ok($$update rmc_auth_private.provider_reservations set reconcile_deadline=reconcile_deadline+interval '1 hour'$$,
  '23514','AUTH_RECONCILE_BUDGET_IMMUTABLE','deadline cannot extend');
update rmc_auth_private.provider_reservations set fence=fence+1,lease_expires_at=clock_timestamp()-interval '1 second';
set local role service_role;
select ok((rmc_auth_api.claim_provider_reconciliation('03000000-0000-4000-8000-000000000002',
  '03000000-0000-4000-8000-000000000006')).command_id is null,'expired lease does not bypass backoff');
reset role;
select ok(not prosecdef,'budget claim remains invoker') from pg_proc
  where oid='rmc_auth_api.claim_provider_reconciliation(uuid,uuid)'::regprocedure;
select ok(not has_function_privilege('authenticated','rmc_auth_api.claim_provider_reconciliation(uuid,uuid)','EXECUTE'),
  'browser role cannot claim');
-- Isolated exact fixtures exercise each stop condition without bypassing guard triggers.
insert into rmc_auth_private.identities(id,role) values
  ('03000000-0000-4000-8000-000000000011','R'),('03000000-0000-4000-8000-000000000012','R');
select rmc_auth_api.claim_command('03000000-0000-4000-8000-000000000021','03000000-0000-4000-8000-000000000031',
  decode(repeat('94',32),'hex'),'PROVISION_IDENTITY',null,'03000000-0000-4000-8000-000000000011');
select rmc_auth_api.claim_command('03000000-0000-4000-8000-000000000022','03000000-0000-4000-8000-000000000032',
  decode(repeat('95',32),'hex'),'PROVISION_IDENTITY',null,'03000000-0000-4000-8000-000000000012');
update rmc_auth_private.command_ledger set state='EFFECT_REQUESTED' where command_id in
  ('03000000-0000-4000-8000-000000000021','03000000-0000-4000-8000-000000000022');
insert into rmc_auth_private.provider_reservations(command_id,identity_id,provider_subject,ownership_binding,
  identity_generation,fence,lease_owner,lease_expires_at,state,reconcile_attempts,next_reconcile_at,reconcile_deadline)
values
  ('03000000-0000-4000-8000-000000000021','03000000-0000-4000-8000-000000000011',gen_random_uuid(),gen_random_uuid(),
    1,1,gen_random_uuid(),clock_timestamp()-interval '1 second','UNKNOWN',8,clock_timestamp()-interval '1 second',clock_timestamp()+interval '1 hour'),
  ('03000000-0000-4000-8000-000000000022','03000000-0000-4000-8000-000000000012',gen_random_uuid(),gen_random_uuid(),
    1,1,gen_random_uuid(),clock_timestamp()-interval '1 second','UNKNOWN',0,clock_timestamp()-interval '1 second',clock_timestamp()-interval '1 second');
set local role service_role;
select ok((rmc_auth_api.claim_provider_reconciliation('03000000-0000-4000-8000-000000000021',gen_random_uuid())).command_id is null,
  'eight attempts exhausted even when backoff and lease expired');
select ok((rmc_auth_api.claim_provider_reconciliation('03000000-0000-4000-8000-000000000022',gen_random_uuid())).command_id is null,
  'deadline exceeded denies even with zero attempts');
select is(state,'UNKNOWN','exhaustion never aborts or fabricates absence') from rmc_auth_private.provider_reservations
  where command_id='03000000-0000-4000-8000-000000000021';
select is(state,'UNKNOWN','expired deadline preserves unresolved resource') from rmc_auth_private.provider_reservations
  where command_id='03000000-0000-4000-8000-000000000022';
reset role;
select * from finish();
rollback;
