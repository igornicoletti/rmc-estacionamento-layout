begin;
set local search_path = extensions, public;
select plan(12);

select ok(not exists (
  select 1 from pg_namespace n,
    aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) acl
  where n.nspname='rmc_auth_private' and acl.grantee=0 and acl.privilege_type='USAGE'
), 'PUBLIC lacks private schema usage');
select ok(not has_schema_privilege('anon', 'rmc_auth_private', 'USAGE'), 'anon lacks private schema usage');
select ok(not has_schema_privilege('authenticated', 'rmc_auth_private', 'USAGE'), 'authenticated lacks private schema usage');
select ok(has_schema_privilege('service_role', 'rmc_auth_private', 'USAGE'), 'service role has explicit private schema usage');
select ok(has_table_privilege('service_role', 'rmc_auth_private.identities', 'SELECT'), 'service role has required direct table access');
select ok(not has_table_privilege('service_role', 'rmc_auth_private.identities', 'DELETE'), 'service role cannot delete identities directly');
select ok(not has_table_privilege('anon', 'rmc_auth_private.identities', 'SELECT'), 'anon has no direct table access');
select ok(not has_table_privilege('authenticated', 'rmc_auth_private.identities', 'SELECT'), 'authenticated has no direct table access');
select ok(has_function_privilege('service_role', 'rmc_auth_api.claim_command(uuid,uuid,bytea,text,uuid,uuid)', 'EXECUTE'), 'service role executes command RPC');
select ok(not exists (
  select 1 from pg_proc p,
    aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
  where p.oid='rmc_auth_api.claim_command(uuid,uuid,bytea,text,uuid,uuid)'::regprocedure
    and acl.grantee=0 and acl.privilege_type='EXECUTE'
), 'PUBLIC executes no command RPC');
select ok(not has_function_privilege('anon', 'rmc_auth_api.consume_challenge(uuid,bigint,timestamp with time zone)', 'EXECUTE'), 'anon executes no challenge RPC');
select ok(not has_function_privilege('authenticated', 'rmc_auth_api.acquire_refresh_lease(uuid,uuid,bigint,integer,timestamp with time zone)', 'EXECUTE'), 'authenticated executes no lease RPC');

select * from finish();
rollback;
