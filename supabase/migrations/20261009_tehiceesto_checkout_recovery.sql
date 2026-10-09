-- Strengthen the existing five-minute payment reconciliation, without scheduling a competing retry job.
-- Never marks a payment approved; only the provider reconciliation can do that.
create table if not exists public.tehiceesto_checkout_recovery_attempts (
  order_id uuid primary key references public.orders(id) on delete cascade,
  first_detected_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0)
);
alter table public.tehiceesto_checkout_recovery_attempts enable row level security;
revoke all on public.tehiceesto_checkout_recovery_attempts from public, anon, authenticated;

create or replace function public.reconcile_tehiceesto_payments()
returns integer language plpgsql security definer
set search_path to pg_catalog, public, net
as $$
declare
  purchase record;
  queued integer := 0;
  action_name text;
begin
  for purchase in
    select o.id,o.payment_token,o.provider_reference
    from public.orders o
    left join public.tehiceesto_checkout_recovery_attempts a on a.order_id=o.id
    where o.status='pending'
      and o.payment_token is not null
      and o.created_at > now() - interval '7 days'
      and (
        o.provider_reference is not null
        or (
          o.checkout_url is null
          and o.created_at > now() - interval '4 hours'
          and o.created_at < now() - interval '90 seconds'
          and (a.last_attempt_at is null or a.last_attempt_at < now() - interval '10 minutes')
          and coalesce(a.attempt_count,0)<12
          and exists (select 1 from public.commerce_settings
                      where id='default' and auto_checkout_enabled=true)
        )
      )
    order by o.created_at desc
    limit 100
  loop
    action_name := case when purchase.provider_reference is null then 'create' else 'sync-status' end;

    if action_name='create' then
      insert into public.tehiceesto_checkout_recovery_attempts(order_id,last_attempt_at,attempt_count)
      values (purchase.id,now(),1)
      on conflict (order_id) do update
        set last_attempt_at=excluded.last_attempt_at,
            attempt_count=public.tehiceesto_checkout_recovery_attempts.attempt_count+1;
    end if;

    perform net.http_post(
      url := 'https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2',
      body := jsonb_build_object('action',action_name,'token',purchase.payment_token),
      headers := '{"content-type":"application/json"}'::jsonb,
      timeout_milliseconds := 15000
    );
    queued := queued+1;
  end loop;
  return queued;
end;
$$;
revoke all on function public.reconcile_tehiceesto_payments() from public, anon, authenticated;
-- Reschedule (upsert by job name), never create a second cron task.
select cron.schedule('tehiceesto-payment-reconciliation','*/5 * * * *',
                    'select public.reconcile_tehiceesto_payments();');
