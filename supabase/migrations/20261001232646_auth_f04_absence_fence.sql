-- A dispatched create can still be in flight after a timeout/GET404.
-- Future compensation must have its own fenced protocol; ABSENT is only pre-dispatch.
create or replace function rmc_auth_private.guard_provider_dispatch()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if old.dispatch_claimed and not new.dispatch_claimed then
    raise exception using errcode='23514',message='AUTH_DISPATCH_IMMUTABLE';
  end if;
  if old.dispatch_claimed and new.state='ABORTED' then
    raise exception using errcode='23514',message='AUTH_PROVISION_ABSENCE_UNPROVEN';
  end if;
  return new;
end $$;
revoke execute on function rmc_auth_private.guard_provider_dispatch() from public,anon,authenticated;
grant execute on function rmc_auth_private.guard_provider_dispatch() to service_role;
