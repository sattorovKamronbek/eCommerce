-- Run in the dedicated VERSAX project after the direct order migration.
begin;

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select cron.schedule(
  'marketplace-expire-direct-orders',
  '* * * * *',
  'select marketplace_private.expire_direct_orders();'
);

commit;
