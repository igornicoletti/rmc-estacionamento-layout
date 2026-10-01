begin;
select plan(13);
insert into rmc_auth_private.identities(id,role) values ('02000000-0000-4000-8000-000000000001','R');
select rmc_auth_api.write_cpf_source('02000000-0000-4000-8000-000000000001',1,1,0,1,
  decode(repeat('83',39),'hex'),array[1],array[decode(repeat('84',32),'hex')]);
select rmc_auth_api.claim_command('02000000-0000-4000-8000-000000000002','02000000-0000-4000-8000-000000000003',
  decode(repeat('85',32),'hex'),'PROVISION_IDENTITY',null,'02000000-0000-4000-8000-000000000001');
select rmc_auth_api.reserve_provider('02000000-0000-4000-8000-000000000002',1,'02000000-0000-4000-8000-000000000004');
select ok(not has_function_privilege('anon','rmc_auth_api.admit_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean)','EXECUTE'),'anon cannot admit');
select ok(not has_function_privilege('authenticated','rmc_auth_api.admit_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean)','EXECUTE'),'authenticated cannot admit');
set local role service_role;
select ok(not rmc_auth_api.admit_provider_attempt(command_id,lease_owner,0,provider_subject,ownership_binding,1,true),'stale fence denies') from rmc_auth_private.provider_reservations;
select ok(not rmc_auth_api.admit_provider_attempt(command_id,lease_owner,fence,provider_subject,gen_random_uuid(),1,true),'changed binding denies') from rmc_auth_private.provider_reservations;
select ok(rmc_auth_api.admit_provider_attempt(command_id,lease_owner,fence,provider_subject,ownership_binding,1,false),'lookup admitted without dispatch') from rmc_auth_private.provider_reservations;
select ok(not dispatch_claimed,'lookup never consumes dispatch') from rmc_auth_private.provider_reservations;
select ok(rmc_auth_api.admit_provider_attempt(command_id,lease_owner,fence,provider_subject,ownership_binding,1,true),'first dispatch admitted') from rmc_auth_private.provider_reservations;
select ok(not rmc_auth_api.admit_provider_attempt(command_id,lease_owner,fence,provider_subject,ownership_binding,1,true),'second dispatch denied') from rmc_auth_private.provider_reservations;
select throws_ok($$update rmc_auth_private.provider_reservations set dispatch_claimed=false$$,'23514','AUTH_DISPATCH_IMMUTABLE','dispatch cannot reset');
select throws_ok($$select rmc_auth_api.record_provider_outcome(command_id,lease_owner,fence,provider_subject,ownership_binding,'ABSENT')
  from rmc_auth_private.provider_reservations$$,'23514','AUTH_PROVISION_ABSENCE_UNPROVEN','404 cannot abort a dispatched create');
reset role;
update rmc_auth_private.identities set lifecycle='BLOCKED',generation=generation+1 where id='02000000-0000-4000-8000-000000000001';
set local role service_role;
select ok(not rmc_auth_api.admit_provider_attempt(command_id,lease_owner,fence,provider_subject,ownership_binding,1,false),'changed target denies lookup') from rmc_auth_private.provider_reservations;
reset role;
select ok(not prosecdef,'admission is invoker') from pg_proc where oid='rmc_auth_api.admit_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean)'::regprocedure;
select ok(proconfig @> array['search_path=""'],'search_path fixed') from pg_proc where oid='rmc_auth_api.admit_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean)'::regprocedure;
select * from finish();
rollback;
