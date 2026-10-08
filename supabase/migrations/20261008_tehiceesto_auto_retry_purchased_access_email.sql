-- Te Hice Esto: retry approved purchases with an unsent email; deployed 2026-10-08.
-- Past payment test orders are excluded by the rollout timestamp.
create or replace function public.retry_tehiceesto_purchase_emails()
returns integer
language plpgsql
security definer
set search_path to pg_catalog, public, net
as $$
declare
  purchase record;
  queued integer := 0;
begin
  for purchase in
    select payment_token
    from public.orders
    where status = 'approved'
      and access_email_sent_at is null
      and buyer_email is not null
      and provider_reference is not null
      and payment_token is not null
      and paid_at >= '2026-10-08 11:00:00+00'::timestamptz
      and paid_at > now() - interval '7 days'
      and (
        access_email_last_attempt_at is null
        or access_email_last_attempt_at < now() - interval '30 minutes'
      )
    order by paid_at asc
    limit 40
  loop
    perform net.http_post(
      url := 'https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2',
      body := jsonb_build_object('action','sync-status','token',purchase.payment_token),
      headers := '{"content-type":"application/json"}'::jsonb,
      timeout_milliseconds := 15000
    );
    queued := queued + 1;
  end loop;
  return queued;
end;
$$;
revoke all on function public.retry_tehiceesto_purchase_emails() from public, anon, authenticated;
select cron.schedule(
  'tehiceesto-access-email-retry',
  '*/30 * * * *',
  'select public.retry_tehiceesto_purchase_emails();'
);
