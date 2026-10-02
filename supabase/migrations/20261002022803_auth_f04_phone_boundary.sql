-- Controlled source staging; no plaintext, caller-selected SQL, or browser grant.
create function rmc_auth_private.stage_provisioning_phone(p_identity uuid,p_generation bigint,
  p_key integer,p_cipher bytea,p_hash bytea)
returns boolean language plpgsql security invoker set search_path='' as $$
declare source rmc_auth_private.provisioning_phone_sources%rowtype;
begin
  if current_user<>'postgres' or p_identity is null or p_generation is null or p_key is null or p_key<1
    or p_cipher is null or octet_length(p_cipher) not between 31 and 44
    or octet_length(p_hash) is distinct from 32 then return false; end if;
  perform id from rmc_auth_private.identities where id=p_identity and generation=p_generation
    and lifecycle='PENDING' and onboarding='ACTIVATION_REQUIRED' for update;
  if not found then return false; end if;
  select * into source from rmc_auth_private.provisioning_phone_sources where identity_id=p_identity;
  if found then
    return source.identity_generation=p_generation and source.key_version=p_key
      and exists(select 1 from rmc_auth_private.identity_lookups where identity_id=p_identity
        and lookup_type='PHONE' and key_version=p_key and lookup_hash=p_hash);
  end if;
  insert into rmc_auth_private.provisioning_phone_sources(identity_id,identity_generation,key_version,ciphertext)
    values(p_identity,p_generation,p_key,p_cipher);
  insert into rmc_auth_private.identity_lookups(identity_id,lookup_type,key_version,lookup_hash)
    values(p_identity,'PHONE',p_key,p_hash);
  return true;
end $$;
revoke execute on function rmc_auth_private.stage_provisioning_phone(uuid,bigint,integer,bytea,bytea)
  from public,anon,authenticated,service_role;
