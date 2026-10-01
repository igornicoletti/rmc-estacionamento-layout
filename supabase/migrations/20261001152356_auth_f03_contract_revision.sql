-- Additive v1.1 adoption: historical audit and ciphertext bytes are preserved.
alter table rmc_auth_private.audit_events drop constraint audit_contract_version;
alter table rmc_auth_private.audit_events add constraint audit_contract_version
  check (contract_version in ('1.0','1.1'));
alter table rmc_auth_private.audit_events alter column contract_version set default '1.1';

-- Codec 1 makes the already implemented IV || ciphertext || tag format explicit.
-- No reinterpretation or re-encryption: algorithm, AAD and byte layout are unchanged.
alter table rmc_auth_private.csrf_material
  add column codec_version smallint not null default 1 check (codec_version=1),
  add column algorithm text not null default 'A256GCM' check (algorithm='A256GCM');
create or replace function rmc_auth_api.read_preauth_context(p_cookie_hash bytea)
returns jsonb language sql security invoker set search_path=''
as $function$
  select jsonb_build_object(
    'contextId',j.id,'purpose',j.purpose,'generation',j.generation,
    'expiresAt',j.expires_at,'serverTime',clock_timestamp(),
    'csrfHash',encode(c.token_hash,'hex'),'ciphertext',encode(c.ciphertext,'hex'),
    'bindingHash',encode(c.binding_hash,'hex'),'keyVersion',c.key_version,
    'codecVersion',c.codec_version,'algorithm',c.algorithm)
  from rmc_auth_private.journey_transactions j
  join rmc_auth_private.csrf_material c on c.journey_id=j.id
  where j.secret_hash=p_cookie_hash and j.purpose='PREAUTH' and j.identity_id is null
    and j.state='PENDING' and j.consumed_at is null and j.expires_at > clock_timestamp()
    and c.generation=j.generation and c.expires_at > clock_timestamp() and c.invalidated_at is null;
$function$;
