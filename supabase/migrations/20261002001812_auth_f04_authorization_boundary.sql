-- Producer belongs to verified provider/step-up boundary (F07), never a browser timestamp.
-- F04 tests insert synthetic facts as postgres; BFF has no INSERT/UPDATE authority here.
create table rmc_auth_private.provisioning_authorization_proofs (
  command_id uuid primary key references rmc_auth_private.command_ledger(command_id),
  session_id uuid not null references rmc_auth_private.functional_sessions(id),
  actor_generation bigint not null check(actor_generation>0),
  session_generation bigint not null check(session_generation>0),
  target_generation bigint not null check(target_generation>0),
  actor_role text not null check(actor_role in ('S','A','M')),
  target_role text not null check(target_role in ('A','R','M','O')),
  intent_hash bytea not null check(octet_length(intent_hash)=32),
  policy_version text not null check(policy_version='1.1'),
  verified_at timestamptz not null,
  consumed_at timestamptz
);
alter table rmc_auth_private.provisioning_authorization_proofs enable row level security;
alter table rmc_auth_private.provisioning_authorization_proofs force row level security;
create function rmc_auth_private.guard_provisioning_proof()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if (new.command_id,new.session_id,new.actor_generation,new.session_generation,new.target_generation,
    new.actor_role,new.target_role,new.intent_hash,new.policy_version,new.verified_at)
    is distinct from (old.command_id,old.session_id,old.actor_generation,old.session_generation,old.target_generation,
    old.actor_role,old.target_role,old.intent_hash,old.policy_version,old.verified_at)
    or (old.consumed_at is not null and new.consumed_at is distinct from old.consumed_at) then
    raise exception using errcode='23514',message='AUTH_PROVISION_PROOF_IMMUTABLE';
  end if;
  return new;
end $$;
create trigger provisioning_proof_guard before update on rmc_auth_private.provisioning_authorization_proofs
  for each row execute function rmc_auth_private.guard_provisioning_proof();
revoke execute on function rmc_auth_private.guard_provisioning_proof() from public,anon,authenticated;
grant execute on function rmc_auth_private.guard_provisioning_proof() to service_role;

create function rmc_auth_private.validate_provisioning_authorization(p_command uuid,p_consume boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
declare cmd rmc_auth_private.command_ledger%rowtype; target rmc_auth_private.identities%rowtype;
  actor rmc_auth_private.identities%rowtype; proof rmc_auth_private.provisioning_authorization_proofs%rowtype;
  session rmc_auth_private.functional_sessions%rowtype;
begin
  select * into cmd from rmc_auth_private.command_ledger where command_id=p_command for update;
  if cmd.command_type is distinct from 'PROVISION_IDENTITY' or p_consume is null then return false; end if;
  -- Avoid SHARE -> UPDATE upgrades at final commit when commands share one actor.
  perform id from rmc_auth_private.identities where id in (cmd.actor_identity_id,cmd.target_identity_id) order by id for update;
  select * into target from rmc_auth_private.identities where id=cmd.target_identity_id;
  if target.id is null or target.lifecycle<>'PENDING' or target.onboarding<>'ACTIVATION_REQUIRED' then return false; end if;
  if not exists(select 1 from rmc_auth_private.provisioning_phone_sources
    where identity_id=target.id and identity_generation=target.generation) then return false; end if;
  if cmd.actor_identity_id is null then
    return target.role='S' and exists(select 1 from rmc_auth_private.day_zero_receipt
      where command_id=p_command and state='RESERVED')
      and exists(select 1 from rmc_auth_private.provisioning_phone_sources where identity_id=target.id and identity_generation=target.generation);
  end if;
  select * into actor from rmc_auth_private.identities where id=cmd.actor_identity_id;
  select * into proof from rmc_auth_private.provisioning_authorization_proofs where command_id=p_command for update;
  select * into session from rmc_auth_private.functional_sessions where id=proof.session_id for share;
  if actor.id=target.id or actor.lifecycle<>'ACTIVE' or actor.onboarding<>'COMPLETE'
    or proof.command_id is null or actor.generation is distinct from proof.actor_generation
    or actor.role is distinct from proof.actor_role or target.role is distinct from proof.target_role
    or target.generation is distinct from proof.target_generation or cmd.intent_hash is distinct from proof.intent_hash
    or session.identity_id is distinct from actor.id or session.purpose<>'NORMAL' or session.assurance<>'aal2'
    or session.revoked_at is not null or session.generation is distinct from proof.session_generation
    or session.identity_generation is distinct from actor.generation or session.expires_at<=clock_timestamp()
    or session.idle_expires_at<=clock_timestamp() or proof.verified_at<clock_timestamp()-interval '300 seconds'
    or proof.verified_at>clock_timestamp()+interval '30 seconds' then return false; end if;
  if not ((actor.role='S' and target.role in ('A','R','M','O')) or (actor.role='A' and target.role in ('R','M','O'))
    or (actor.role='M' and target.role='O')) then return false; end if;
  -- ERP identity is not proved yet. No fixture or is_eligible bit opens unit-scoped provisioning.
  if actor.role='M' or target.role in ('M','O') then return false; end if;
  if p_consume and proof.consumed_at is null then
    update rmc_auth_private.provisioning_authorization_proofs set consumed_at=clock_timestamp() where command_id=p_command;
  end if;
  return true;
end $$;
create function rmc_auth_api.admit_authorized_provider_attempt(p_command uuid,p_owner uuid,p_fence bigint,
  p_provider uuid,p_binding uuid,p_generation bigint,p_mutation boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
declare cmd rmc_auth_private.command_ledger%rowtype;
  reservation rmc_auth_private.provider_reservations%rowtype;
begin
  if p_mutation is false then
    -- Reconciliation may inspect the reserved UUID after actor revocation. It cannot
    -- create, promote, or authorize a new intent; final commit still revalidates.
    select * into cmd from rmc_auth_private.command_ledger where command_id=p_command for update;
    select * into reservation from rmc_auth_private.provider_reservations where command_id=p_command for update;
    if cmd.command_type is distinct from 'PROVISION_IDENTITY'
      or cmd.state not in ('EFFECT_REQUESTED','RECONCILIATION_REQUIRED','EFFECT_CONFIRMED')
      or reservation.command_id is null or reservation.identity_id is distinct from cmd.target_identity_id
      or reservation.lease_owner is distinct from p_owner or reservation.fence is distinct from p_fence
      or reservation.provider_subject is distinct from p_provider or reservation.ownership_binding is distinct from p_binding
      or reservation.identity_generation is distinct from p_generation or reservation.lease_expires_at<=clock_timestamp()
      or reservation.state not in ('RESERVED','UNKNOWN','CONFIRMED') then return false; end if;
    if not exists(select 1 from rmc_auth_private.identities where id=reservation.identity_id
      and lifecycle='PENDING' and generation=p_generation and provider_subject is null) then return false; end if;
    return rmc_auth_private.validate_provisioning_authorization(p_command,false)
      or (cmd.actor_identity_id is null and exists(select 1 from rmc_auth_private.day_zero_receipt
      where command_id=p_command and state='RESERVED'))
      or exists(select 1 from rmc_auth_private.provisioning_authorization_proofs
        where command_id=p_command and intent_hash=cmd.intent_hash and consumed_at is not null);
  end if;
  -- Same command lock covers authorization consumption and dispatch admission.
  if not rmc_auth_private.validate_provisioning_authorization(p_command,p_mutation) then return false; end if;
  return rmc_auth_api.admit_provider_attempt(p_command,p_owner,p_fence,p_provider,p_binding,p_generation,p_mutation);
end $$;
create function rmc_auth_api.commit_authorized_provider_reservation(p_command uuid,p_owner uuid,p_fence bigint,p_request uuid,p_deployment text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  if not rmc_auth_private.validate_provisioning_authorization(p_command,false) then return false; end if;
  if exists(select 1 from rmc_auth_private.provisioning_authorization_proofs where command_id=p_command and consumed_at is null) then return false; end if;
  return rmc_auth_api.commit_provider_reservation(p_command,p_owner,p_fence,p_request,p_deployment);
end $$;
revoke execute on function rmc_auth_private.validate_provisioning_authorization(uuid,boolean),
  rmc_auth_api.admit_authorized_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean),
  rmc_auth_api.commit_authorized_provider_reservation(uuid,uuid,bigint,uuid,text) from public,anon,authenticated;
grant select on rmc_auth_private.provisioning_authorization_proofs,rmc_auth_private.day_zero_receipt,
  rmc_auth_private.provisioning_phone_sources to service_role;
grant update(consumed_at) on rmc_auth_private.provisioning_authorization_proofs to service_role;
grant execute on function rmc_auth_private.validate_provisioning_authorization(uuid,boolean),
  rmc_auth_api.admit_authorized_provider_attempt(uuid,uuid,bigint,uuid,uuid,bigint,boolean),
  rmc_auth_api.commit_authorized_provider_reservation(uuid,uuid,bigint,uuid,text) to service_role;
