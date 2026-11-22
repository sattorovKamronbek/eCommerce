-- Run as the database administrator in the dedicated VERSAX project.
begin;

do $$
begin
  if not exists (
    select 1 from cron.job j join cron.job_run_details r on r.jobid = j.jobid
    where j.jobname = 'marketplace-expire-direct-orders' and j.active
      and r.status = 'succeeded' and r.end_time > now() - interval '5 minutes'
  ) then
    raise exception 'The reservation expiration job must pass before launch';
  end if;

  perform 1 from marketplace_private.direct_order_settings where singleton for update;
  if not found then
    raise exception 'Direct order settings are missing';
  end if;
  if exists (
    select 1 from marketplace_private.direct_order_settings
    where singleton and accepting_orders and accepting_ecosystems <> array['cs2']
  ) then
    raise exception 'Reservations are already enabled for another ecosystem scope';
  end if;

  update marketplace_private.direct_order_settings
    set accepting_orders = true, accepting_ecosystems = array['cs2']
    where singleton;
end;
$$;

commit;
