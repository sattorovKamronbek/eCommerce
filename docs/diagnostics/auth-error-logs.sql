-- Read-only diagnostic. Run in Supabase SQL Editor with Source set to Logs.
-- This uses the Logs query engine, not the PostgreSQL database connection.
-- Select a time range covering the failed signup/resend (for example, Last 24h).
select
  timestamp,
  log_attributes['error'] as smtp_error,
  log_attributes['msg'] as message,
  event_message
from logs
where source = 'auth_logs'
  and (
    toInt32OrZero(log_attributes['status']) = 500
    or log_attributes['level'] in ('error', 'fatal')
  )
order by timestamp desc
limit 15;
